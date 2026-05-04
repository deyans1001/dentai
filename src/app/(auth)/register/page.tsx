"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WorkingHours } from "@/types";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http") &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_url");

const CITIES = ["София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора", "Плевен", "Добрич"];
const SERVICES = [
  "Профилактика",
  "Почистване",
  "Избелване",
  "Пломби",
  "Коренови канали",
  "Импланти",
  "Коронки",
  "Фасети",
  "Ортодонтия",
  "Детска стоматология",
  "Протетика",
  "Хирургия",
  "Спешна помощ",
];
const STAFF_ROLES = [
  { value: "dentist", label: "Зъболекар" },
  { value: "orthodontist", label: "Ортодонт" },
  { value: "hygienist", label: "Хигиенист" },
  { value: "surgeon", label: "Хирург" },
  { value: "pediatric", label: "Детски дентист" },
  { value: "assistant", label: "Асистент" },
  { value: "receptionist", label: "Рецепционист" },
];
const WORKING_DAYS = ["Пон", "Вт", "Ср", "Чет", "Пет", "Съб"];
const WORKING_DAYS_VALUES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

interface StaffMember {
  name: string;
  role: string;
  working_days: string[];
  working_hours: { open: string; close: string };
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { open: "09:00", close: "18:00", isOpen: true },
  tuesday: { open: "09:00", close: "18:00", isOpen: true },
  wednesday: { open: "09:00", close: "18:00", isOpen: true },
  thursday: { open: "09:00", close: "18:00", isOpen: true },
  friday: { open: "09:00", close: "18:00", isOpen: true },
  saturday: { open: "09:00", close: "14:00", isOpen: false },
  sunday: { open: "09:00", close: "14:00", isOpen: false },
};

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Понеделник",
  tuesday: "Вторник",
  wednesday: "Сряда",
  thursday: "Четвъртък",
  friday: "Петък",
  saturday: "Събота",
  sunday: "Неделя",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 flex items-center justify-center"><p className="text-slate-400">Зареждане...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "STARTER";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+359");

  // Step 2
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  // Step 3
  const [staff, setStaff] = useState<StaffMember[]>([
    { name: "", role: "dentist", working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], working_hours: { open: "09:00", close: "18:00" } },
  ]);

  // Step 4
  const [selectedServices, setSelectedServices] = useState<string[]>(["Профилактика", "Почистване", "Пломби"]);
  const [customService, setCustomService] = useState("");

  function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
    if (pw.length < 6) return { label: "Слаба", color: "bg-red-500", width: "w-1/4" };
    if (pw.length < 10) return { label: "Средна", color: "bg-yellow-500", width: "w-2/4" };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: "Силна", color: "bg-green-500", width: "w-full" };
    return { label: "Добра", color: "bg-blue-500", width: "w-3/4" };
  }

  function addStaff() {
    setStaff((prev) => [
      ...prev,
      { name: "", role: "dentist", working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], working_hours: { open: "09:00", close: "18:00" } },
    ]);
  }

  function removeStaff(index: number) {
    setStaff((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStaff(index: number, field: keyof StaffMember, value: StaffMember[keyof StaffMember]) {
    setStaff((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function toggleStaffDay(staffIndex: number, day: string) {
    const currentDays = staff[staffIndex].working_days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateStaff(staffIndex, "working_days", newDays);
  }

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function addCustomService() {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      setSelectedServices((prev) => [...prev, customService.trim()]);
      setCustomService("");
    }
  }

  function toggleWorkingDay(day: string) {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof WorkingHours],
        isOpen: !prev[day as keyof WorkingHours]?.isOpen,
      },
    }));
  }

  function updateWorkingHours(day: string, field: "open" | "close", value: string) {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof WorkingHours],
        [field]: value,
      },
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Use server-side API — uses service role key, bypasses RLS and email confirmation
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          clinicName,
          ownerName,
          phone,
          city,
          address,
          website: website || null,
          workingHours,
          services: selectedServices,
          plan: selectedPlan,
          staff,
        }),
      });

      const data = await res.json() as { success?: boolean; clinicId?: string; error?: string };

      if (!res.ok || !data.success) {
        const msg = data.error || "Грешка при регистрация";
        if (msg.includes("вече е регистриран") || msg.includes("already")) {
          setError("Този имейл вече е регистриран. Влезте в акаунта си.");
        } else if (msg.includes("password") || msg.includes("парол")) {
          setError("Паролата трябва да е поне 6 символа.");
        } else {
          setError(msg);
        }
        return;
      }

      if (data.clinicId) {
        localStorage.setItem("clinicId", data.clinicId);
      }

      // Sign in automatically after registration
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      router.push("/dashboard");
    } catch {
      setError("Неочаквана грешка. Моля, опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-2xl">
              🦷
            </div>
            <span className="text-2xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <p className="text-slate-400 mt-2">Регистрирайте вашата клиника</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {["Основна информация", "Клиника", "Персонал", "Услуги"].map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step > i + 1
                      ? "bg-brand-green text-white"
                      : step === i + 1
                      ? "bg-brand-blue text-white"
                      : "bg-dark-700 text-slate-500"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-white" : "text-slate-500"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-blue transition-all duration-500 rounded-full"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white mb-6">Основна информация</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Име на клиника *</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Дентал Смайл"
                    className={`w-full px-4 py-3 rounded-xl bg-dark-700 border text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors ${fieldErrors.clinicName ? "border-red-500" : "border-white/10"}`}
                  />
                  {fieldErrors.clinicName && <p className="text-red-400 text-xs mt-1">{fieldErrors.clinicName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Собственик *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Д-р Иван Иванов"
                    className={`w-full px-4 py-3 rounded-xl bg-dark-700 border text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors ${fieldErrors.ownerName ? "border-red-500" : "border-white/10"}`}
                  />
                  {fieldErrors.ownerName && <p className="text-red-400 text-xs mt-1">{fieldErrors.ownerName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Имейл адрес *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clinic@example.com"
                  className={`w-full px-4 py-3 rounded-xl bg-dark-700 border text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors ${fieldErrors.email ? "border-red-500" : "border-white/10"}`}
                />
                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Парола *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символа"
                  className={`w-full px-4 py-3 rounded-xl bg-dark-700 border text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors ${fieldErrors.password ? "border-red-500" : "border-white/10"}`}
                />
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                {password && !fieldErrors.password && (
                  <div className="mt-2">
                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                      <div className={`h-full ${pwStrength.color} ${pwStrength.width} transition-all`} />
                    </div>
                    <p className="text-xs mt-1 text-slate-400">Сигурност: {pwStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+359 88 123 4567"
                  className={`w-full px-4 py-3 rounded-xl bg-dark-700 border text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors ${fieldErrors.phone ? "border-red-500" : "border-white/10"}`}
                />
                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Clinic details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white mb-6">Данни за клиниката</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Град *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Изберете град</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Уебсайт</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://myClinic.bg"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Адрес *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="бул. Витоша 45, ет. 2"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Работно време</label>
                <div className="space-y-2">
                  {DAY_KEYS.map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`w-16 text-xs py-1.5 rounded-lg font-medium transition-all ${
                          workingHours[day]?.isOpen
                            ? "bg-brand-blue text-white"
                            : "bg-dark-700 text-slate-500"
                        }`}
                      >
                        {DAY_LABELS[day].slice(0, 3)}
                      </button>
                      {workingHours[day]?.isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={workingHours[day]?.open || "09:00"}
                            onChange={(e) => updateWorkingHours(day, "open", e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                          />
                          <span className="text-slate-500 text-sm">—</span>
                          <input
                            type="time"
                            value={workingHours[day]?.close || "18:00"}
                            onChange={(e) => updateWorkingHours(day, "close", e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">Затворено</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Staff */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-white mb-6">Персонал</h2>

              {staff.map((member, idx) => (
                <div key={idx} className="bg-dark-700 rounded-xl p-5 border border-white/8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Лекар {idx + 1}</h3>
                    {staff.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStaff(idx)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        Премахни
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Имена *</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateStaff(idx, "name", e.target.value)}
                        placeholder="Д-р Мария Иванова"
                        className="w-full px-3 py-2.5 rounded-lg bg-dark-600 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Роля *</label>
                      <select
                        value={member.role}
                        onChange={(e) => updateStaff(idx, "role", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-dark-600 border border-white/10 text-white text-sm outline-none focus:border-brand-blue transition-colors"
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-slate-400 mb-2">Работни дни</label>
                    <div className="flex flex-wrap gap-2">
                      {WORKING_DAYS.map((day, di) => (
                        <button
                          key={di}
                          type="button"
                          onClick={() => toggleStaffDay(idx, WORKING_DAYS_VALUES[di])}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            member.working_days.includes(WORKING_DAYS_VALUES[di])
                              ? "bg-brand-blue text-white"
                              : "bg-dark-600 text-slate-500"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">Начало</label>
                      <input
                        type="time"
                        value={member.working_hours.open}
                        onChange={(e) =>
                          updateStaff(idx, "working_hours", { ...member.working_hours, open: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">Край</label>
                      <input
                        type="time"
                        value={member.working_hours.close}
                        onChange={(e) =>
                          updateStaff(idx, "working_hours", { ...member.working_hours, close: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addStaff}
                className="w-full py-3 rounded-xl border border-brand-blue/40 text-brand-blue hover:bg-brand-blue/10 transition-all text-sm font-medium"
              >
                + Добавете лекар
              </button>
            </div>
          )}

          {/* Step 4: Services */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-white mb-6">Услуги на клиниката</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SERVICES.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                      selectedServices.includes(service)
                        ? "bg-brand-blue/20 border-brand-blue/50 text-blue-300"
                        : "bg-dark-700 border-white/8 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {selectedServices.includes(service) ? "✓ " : ""}{service}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomService()}
                  placeholder="Добавете своя услуга..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={addCustomService}
                  className="px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-medium"
                >
                  Добави
                </button>
              </div>

              {selectedServices.length > 0 && (
                <p className="text-slate-400 text-sm">
                  Избрани: <strong className="text-white">{selectedServices.length} услуги</strong>
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-all"
              >
                ← Назад
              </button>
            ) : (
              <a href="/login" className="text-slate-400 text-sm hover:text-slate-300">
                Вече имам акаунт
              </a>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setFieldErrors({});
                  if (step === 1) {
                    const errs: Record<string, string> = {};
                    if (!clinicName.trim()) errs.clinicName = "Задължително поле";
                    if (!ownerName.trim()) errs.ownerName = "Задължително поле";
                    if (!email.trim()) errs.email = "Задължително поле";
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Невалиден имейл адрес";
                    if (!password) errs.password = "Задължително поле";
                    else if (password.length < 6) errs.password = "Минимум 6 символа";
                    if (!phone.trim() || phone === "+359") errs.phone = "Задължително поле";
                    else if (!/^\+?[0-9\s\-]{8,}$/.test(phone)) errs.phone = "Невалиден телефонен номер";
                    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
                  }
                  if (step === 2 && (!city || !address)) {
                    setError("Моля, попълнете град и адрес.");
                    return;
                  }
                  if (step === 3 && staff.filter((s) => s.name.trim()).length === 0) {
                    setError("Добавете поне един лекар.");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-8 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold transition-all"
              >
                Напред →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || selectedServices.length === 0}
                className="px-8 py-2.5 rounded-xl bg-brand-green hover:bg-green-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Регистрация...
                  </>
                ) : "Завършете регистрацията"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
