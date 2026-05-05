"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Staff } from "@/types";
import { STAFF_ROLE_LABELS } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const STAFF_ROLES = [
  { value: "dentist", label: "Зъболекар" },
  { value: "orthodontist", label: "Ортодонт" },
  { value: "hygienist", label: "Хигиенист" },
  { value: "surgeon", label: "Хирург" },
  { value: "pediatric", label: "Детски дентист" },
  { value: "assistant", label: "Асистент" },
  { value: "receptionist", label: "Рецепционист" },
];

const WORKING_DAYS = [
  { label: "Пон", value: "monday" },
  { label: "Вт", value: "tuesday" },
  { label: "Ср", value: "wednesday" },
  { label: "Чет", value: "thursday" },
  { label: "Пет", value: "friday" },
  { label: "Съб", value: "saturday" },
];

interface StaffForm {
  name: string;
  role: string;
  working_days: string[];
  working_hours: { open: string; close: string };
}

const DEFAULT_FORM: StaffForm = {
  name: "",
  role: "dentist",
  working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  working_hours: { open: "09:00", close: "18:00" },
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(DEFAULT_FORM);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!clinic) return;
    setClinicId(clinic.id);

    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: true });

    setStaff((data || []) as Staff[]);
    setLoading(false);
  }

  function openAddModal() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(member: Staff) {
    setForm({
      name: member.name,
      role: member.role,
      working_days: member.working_days,
      working_hours: member.working_hours as { open: string; close: string },
    });
    setEditingId(member.id);
    setShowModal(true);
  }

  async function saveStaff() {
    if (!clinicId || !form.name.trim()) return;
    setSaving(true);

    try {
      const supabase = createClient();

      if (editingId) {
        await supabase
          .from("staff")
          .update({
            name: form.name,
            role: form.role,
            working_days: form.working_days,
            working_hours: form.working_hours,
          })
          .eq("id", editingId);
      } else {
        await supabase.from("staff").insert({
          clinic_id: clinicId,
          name: form.name,
          role: form.role,
          working_days: form.working_days,
          working_hours: form.working_hours,
          is_active: true,
        });
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Грешка при запазване");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStaff(id: string) {
    const supabase = createClient();
    await supabase.from("staff").delete().eq("id", id);
    setDeleteConfirm(null);
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("staff").update({ is_active: !current }).eq("id", id);
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter((d) => d !== day)
        : [...f.working_days, day],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Персонал</h1>
          <p className="text-slate-400 text-sm mt-1">Управление на лекари и асистенти</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Добави лекар
        </button>
      </div>

      {/* Info banner */}
      <div className="px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center gap-3">
        <span className="text-xl">🤖</span>
        <p className="text-slate-300 text-sm">
          Промените автоматично се отразяват в AI рецепциониста
        </p>
      </div>

      {/* Staff table */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-400 mb-4">Няма добавен персонал</p>
            <button
              onClick={openAddModal}
              className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium"
            >
              Добавете лекар
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Имена</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Роля</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Работни дни</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Часове</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Активен</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const wh = member.working_hours as { open: string; close: string };
                  return (
                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{member.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">
                          {STAFF_ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.working_days.map((d) => {
                            const dayMap: Record<string, string> = { monday: "Пон", tuesday: "Вт", wednesday: "Ср", thursday: "Чет", friday: "Пет", saturday: "Съб", sunday: "Нед" };
                            return (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-slate-400">
                                {dayMap[d] || d}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {wh?.open || "09:00"} — {wh?.close || "18:00"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(member.id, member.is_active)}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            member.is_active ? "bg-brand-green" : "bg-dark-600"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              member.is_active ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded-lg bg-dark-700 text-slate-400 hover:text-white hover:bg-dark-600 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(member.id)}
                            className="p-1.5 rounded-lg bg-dark-700 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-heading font-bold">
                {editingId ? "Редактиране на лекар" : "Добавяне на лекар"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Имена *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Д-р Мария Иванова"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Роля *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Работни дни</label>
                <div className="flex flex-wrap gap-2">
                  {WORKING_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.working_days.includes(day.value)
                          ? "bg-brand-blue text-white"
                          : "bg-dark-700 text-slate-500"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Начало на работа</label>
                  <input
                    type="time"
                    value={form.working_hours.open}
                    onChange={(e) => setForm((f) => ({ ...f, working_hours: { ...f.working_hours, open: e.target.value } }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Край на работа</label>
                  <input
                    type="time"
                    value={form.working_hours.close}
                    onChange={(e) => setForm((f) => ({ ...f, working_hours: { ...f.working_hours, close: e.target.value } }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-300 text-sm"
              >
                Отказ
              </button>
              <button
                onClick={saveStaff}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Запазване..." : "Запазете"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Изтриване на лекар</h3>
            <p className="text-slate-400 text-sm mb-6">
              Сигурни ли сте? Тази операция е необратима.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-300 text-sm"
              >
                Отказ
              </button>
              <button
                onClick={() => deleteStaff(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-brand-red hover:bg-red-600 text-white font-semibold text-sm"
              >
                Изтрийте
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
