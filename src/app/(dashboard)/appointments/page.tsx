"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Appointment, Staff, Clinic } from "@/types";
import { formatDate, formatTime, APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Filter states
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState("");

  // New appointment form
  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    service: "",
    staff_id: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration_minutes: 30,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [filterDate, filterStatus]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!clinicData) return;
    setClinic(clinicData as Clinic);
    setCalendarConnected(!!clinicData.google_calendar_token);

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("clinic_id", clinicData.id)
      .eq("is_active", true);

    setStaff((staffData || []) as Staff[]);

    let query = supabase
      .from("appointments")
      .select("*, staff(name, role)")
      .eq("clinic_id", clinicData.id)
      .eq("date", filterDate)
      .order("time", { ascending: true });

    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setAppointments((data || []) as Appointment[]);
    setLoading(false);
  }

  async function saveAppointment() {
    if (!clinic || !form.patient_name || !form.service || !form.date || !form.time) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: apt, error } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinic.id,
          staff_id: form.staff_id || null,
          patient_name: form.patient_name,
          patient_phone: form.patient_phone,
          patient_email: form.patient_email || null,
          service: form.service,
          date: form.date,
          time: form.time,
          duration_minutes: form.duration_minutes,
          status: "CONFIRMED",
          created_by: "MANUAL",
          notes: form.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create Google Calendar event if connected
      if (calendarConnected && apt) {
        const staffMember = staff.find((s) => s.id === form.staff_id);
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinicId: clinic.id,
            summary: `${form.service} — ${form.patient_name}`,
            date: form.date,
            time: form.time,
            duration: form.duration_minutes,
            description: `Пациент: ${form.patient_name}\nТелефон: ${form.patient_phone}\nЛекар: ${staffMember?.name || "Не е избран"}\nБележки: ${form.notes}`,
            attendeeEmail: form.patient_email,
          }),
        });
      }

      setShowModal(false);
      setForm({ patient_name: "", patient_phone: "", patient_email: "", service: "", staff_id: "", date: new Date().toISOString().split("T")[0], time: "10:00", duration_minutes: 30, notes: "" });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Грешка при запазване на час");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: status as Appointment["status"] } : a));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Часове</h1>
          <p className="text-slate-400 text-sm mt-1">Управление на записани пациенти</p>
        </div>
        <div className="flex items-center gap-3">
          {calendarConnected ? (
            <span className="text-xs text-brand-green bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              🔗 Google Calendar свързан
            </span>
          ) : (
            <a
              href={`/api/calendar?action=auth&state=${clinic?.id}`}
              className="text-xs text-brand-blue bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all"
            >
              Свържи Google Calendar
            </a>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium transition-all"
          >
            <Plus size={16} />
            Добави час
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-dark-800 border border-white/8 rounded-xl p-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Дата</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Статус</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Всички</option>
            <option value="CONFIRMED">Потвърден</option>
            <option value="COMPLETED">Завършен</option>
            <option value="CANCELLED">Отменен</option>
            <option value="NO_SHOW">Не се яви</option>
          </select>
        </div>
      </div>

      {/* Appointments table */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold">
            {formatDate(filterDate)} — {appointments.length} часа
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400">Няма часове за тази дата</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium"
              >
                Добавете час
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Час</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Пациент</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Услуга</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Лекар</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Статус</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-brand-blue font-medium">{formatTime(apt.time)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{apt.patient_name}</p>
                      <p className="text-slate-500 text-xs">{apt.patient_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{apt.service}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {(apt as Appointment & { staff?: Staff }).staff?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${APPOINTMENT_STATUS_COLORS[apt.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={apt.status}
                        onChange={(e) => updateStatus(apt.id, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-dark-700 border border-white/10 text-slate-300 outline-none"
                      >
                        <option value="CONFIRMED">Потвърден</option>
                        <option value="COMPLETED">Завършен</option>
                        <option value="CANCELLED">Отменен</option>
                        <option value="NO_SHOW">Не се яви</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-heading font-bold">Добавете час</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Пациент *</label>
                  <input
                    type="text"
                    value={form.patient_name}
                    onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
                    placeholder="Три имена"
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Телефон *</label>
                  <input
                    type="tel"
                    value={form.patient_phone}
                    onChange={(e) => setForm((f) => ({ ...f, patient_phone: e.target.value }))}
                    placeholder="+359 88..."
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Имейл</label>
                <input
                  type="email"
                  value={form.patient_email}
                  onChange={(e) => setForm((f) => ({ ...f, patient_email: e.target.value }))}
                  placeholder="patient@email.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Услуга *</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  >
                    <option value="">Изберете</option>
                    {(clinic?.services || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Лекар</label>
                  <select
                    value={form.staff_id}
                    onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  >
                    <option value="">Не е избран</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Дата *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Час *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Продължителност</label>
                  <select
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  >
                    <option value={15}>15 мин</option>
                    <option value={30}>30 мин</option>
                    <option value={45}>45 мин</option>
                    <option value={60}>60 мин</option>
                    <option value={90}>90 мин</option>
                    <option value={120}>120 мин</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Бележки</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Допълнителна информация..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-all text-sm"
              >
                Отказ
              </button>
              <button
                onClick={saveAppointment}
                disabled={saving || !form.patient_name || !form.service || !form.date || !form.time}
                className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {saving ? "Запазване..." : "Запазете час"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
