"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clinic, Payment } from "@/types";
import { formatDate, formatCurrency, PLAN_LABELS, PLAN_COLORS } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

type Tab = "clinic" | "ai" | "calendar" | "chatbot" | "subscription" | "profile";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("clinic");
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clinic form
  const [clinicForm, setClinicForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    website: "",
  });

  // AI form
  const [customGreeting, setCustomGreeting] = useState("");

  // Profile form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (clinicData) {
      setClinic(clinicData as Clinic);
      setClinicForm({
        name: clinicData.name,
        phone: clinicData.phone,
        address: clinicData.address,
        city: clinicData.city,
        website: clinicData.website || "",
      });
      setCustomGreeting(clinicData.custom_greeting || "");
    }

    const { data: paymentData } = await supabase
      .from("payments")
      .select("*")
      .eq("clinic_id", clinicData?.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setPayments((paymentData || []) as Payment[]);
    setLoading(false);
  }

  async function saveClinic() {
    if (!clinic) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("clinics")
      .update({ ...clinicForm, updated_at: new Date().toISOString() })
      .eq("id", clinic.id);

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
    loadData();
  }

  async function saveGreeting() {
    if (!clinic) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("clinics")
      .update({ custom_greeting: customGreeting, updated_at: new Date().toISOString() })
      .eq("id", clinic.id);

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      alert("Паролите не съвпадат");
      return;
    }
    if (newPassword.length < 8) {
      alert("Паролата трябва да е поне 8 символа");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert("Грешка при промяна на паролата");
    } else {
      alert("Паролата е сменена успешно");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  function copyEmbedCode() {
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js" data-clinic="${clinic?.id}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "clinic", label: "Клиника" },
    { id: "ai", label: "AI" },
    { id: "calendar", label: "Google Calendar" },
    { id: "chatbot", label: "Чатбот" },
    { id: "subscription", label: "Абонамент" },
    { id: "profile", label: "Профил" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Настройки</h1>
        <p className="text-slate-400 text-sm mt-1">Конфигурирайте вашия AI рецепционист</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-dark-800 border border-white/8 rounded-xl p-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-brand-blue text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Saved toast */}
      {saved && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
          <Check size={16} />
          Промените са запазени успешно
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* Clinic tab */}
          {tab === "clinic" && (
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Данни за клиниката</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Наименование", key: "name" as keyof typeof clinicForm, placeholder: "Дентал Смайл" },
                  { label: "Телефон", key: "phone" as keyof typeof clinicForm, placeholder: "+359 88..." },
                  { label: "Адрес", key: "address" as keyof typeof clinicForm, placeholder: "бул. Витоша 45" },
                  { label: "Град", key: "city" as keyof typeof clinicForm, placeholder: "София" },
                  { label: "Уебсайт", key: "website" as keyof typeof clinicForm, placeholder: "https://..." },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={clinicForm[field.key]}
                      onChange={(e) => setClinicForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={saveClinic}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Запазване..." : "Запазете промените"}
              </button>
            </div>
          )}

          {/* AI tab */}
          {tab === "ai" && (
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">AI Настройки</h2>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Персонализиран поздрав</label>
                <textarea
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  placeholder={`Добър ден! Обадихте се в ${clinic?.name}. С какво мога да Ви помогна?`}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue resize-none"
                />
                <p className="text-slate-500 text-xs mt-1">
                  Персонализирайте как AI поздравява пациентите
                </p>
              </div>
              <button
                onClick={saveGreeting}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Запазване..." : "Запазете"}
              </button>
            </div>
          )}

          {/* Calendar tab */}
          {tab === "calendar" && (
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Google Calendar</h2>
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                clinic?.google_calendar_token
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-dark-700 border-white/10"
              }`}>
                <div className="text-2xl">{clinic?.google_calendar_token ? "✅" : "📅"}</div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {clinic?.google_calendar_token ? "Google Calendar е свързан" : "Google Calendar не е свързан"}
                  </p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {clinic?.google_calendar_token
                      ? "Часовете се записват автоматично в Calendar"
                      : "Свържете Calendar за автоматично записване"}
                  </p>
                </div>
                {clinic?.google_calendar_token ? (
                  <button className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-all">
                    Изключете
                  </button>
                ) : (
                  <a
                    href={`/api/calendar?action=auth&state=${clinic?.id}`}
                    className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium transition-all"
                  >
                    Свържете
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Chatbot tab */}
          {tab === "chatbot" && (
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Embed код за уебсайт</h2>
              <p className="text-slate-400 text-sm">
                Поставете този код на вашия уебсайт, за да добавите AI чатбот
              </p>
              <div className="bg-dark-700 rounded-xl p-4 border border-white/10 relative">
                <code className="text-xs text-green-400 font-mono break-all">
                  {`<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://dentai.bg"}/embed.js" data-clinic="${clinic?.id}"></script>`}
                </code>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-slate-400 hover:text-white transition-all"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Subscription tab */}
          {tab === "subscription" && (
            <div className="space-y-4">
              <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Текущ абонамент</h2>
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${PLAN_COLORS[clinic?.plan || "TRIAL"]}`}>
                    {PLAN_LABELS[clinic?.plan || "TRIAL"]} план
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    clinic?.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                    clinic?.status === "TRIAL" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {clinic?.status === "ACTIVE" ? "Активен" : clinic?.status === "TRIAL" ? "Пробен период" : "Изтекъл"}
                  </span>
                </div>
                {clinic?.trial_ends_at && (
                  <p className="text-slate-400 text-sm">
                    Пробният период изтича: {formatDate(clinic.trial_ends_at)}
                  </p>
                )}
                <a
                  href="/#pricing"
                  className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium transition-all"
                >
                  Промяна на план
                </a>
              </div>

              <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">История на плащанията</h2>
                {payments.length === 0 ? (
                  <p className="text-slate-500 text-sm">Няма плащания</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/8">
                          <th className="pb-3 text-left text-xs text-slate-500">Дата</th>
                          <th className="pb-3 text-left text-xs text-slate-500">План</th>
                          <th className="pb-3 text-left text-xs text-slate-500">Сума</th>
                          <th className="pb-3 text-left text-xs text-slate-500">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-white/5">
                            <td className="py-3 text-slate-400 text-sm">{formatDate(p.created_at)}</td>
                            <td className="py-3 text-slate-300 text-sm">{PLAN_LABELS[p.plan]}</td>
                            <td className="py-3 text-white text-sm font-medium">{formatCurrency(p.amount, p.currency)}</td>
                            <td className="py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {p.status === "COMPLETED" ? "Успешно" : "Грешка"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile tab */}
          {tab === "profile" && (
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-6">
              <h2 className="text-white font-semibold">Промяна на парола</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Нова парола</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символа"
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Потвърдете паролата</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторете паролата"
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <button
                  onClick={changePassword}
                  disabled={!newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  Смяна на парола
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-4">
      <div className="h-5 w-40 bg-dark-700 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-dark-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
