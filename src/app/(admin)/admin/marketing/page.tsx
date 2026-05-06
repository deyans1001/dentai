"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { MarketingPost } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const COLD_EMAILS = [
  {
    id: "lost-patients",
    label: "Шаблон 1 — Изгубени пациенти (висока конверсия)",
    subject: "Д-р [Фамилия], изчислих колко пациенти сте загубили миналата седмица",
    body: `Здравейте,

Казвам се Деян Стойчев от DentAI.

Знам, че получавате много такива имейли. Затова ще бъда директен.

Миналата седмица [Клиника] е пропуснала обаждания. Не знам точния брой — но знам, че средната клиника с вашия профил пропуска между 40 и 80 на месец.

При средна стойност от 180 лв. на нов пациент и конверсия 25% — това са 1 800–3 600 лв. изгубени всеки месец. Само защото телефонът не е отговорен.

Тези пациенти не изчезват. Те се обаждат на следващата клиника в Google — и стават техни.

За последните 6 месеца помогнахме на 23 дентални клиники в България да спрат да губят пациенти след работно време. Средното увеличение на записванията е 37% за първите 30 дни.

Не искам да ви продавам нищо сега. Искам да ви покажа как изглежда системата за 15 минути — за да прецените сами дали има смисъл.

Имате ли 15 минути тази или следващата седмица?

С уважение,
Деян Стойчев
DentAI — AI рецепционист за дентални клиники
📞 089 703 7079
teamsupportdentai@gmail.com`,
  },
  {
    id: "competitor",
    label: "Шаблон 2 — Конкурентен натиск (FOMO)",
    subject: "Вашите конкуренти в [Град] вече използват AI рецепционист",
    body: `Д-р [Фамилия],

Не е тайна: денталните клиники, които отговарят пръв, печелят пациента.

73% от пациентите записват час при първата клиника, която им е отговорила — не при най-добрата, не при най-близката. При първата.

В момента в [Град] работят клиники с AI рецепционист, който отговаря в 23:14 в неделя. В петък след 18:00. На обяд, докато рецепционистът е на почивка.

Тези обаждания — пациенти, готови да запишат час — преди са се губели. Сега ги улавят.

Въпросът не е дали AI рецепционистът е бъдещето. Въпросът е кога ще го приемете — преди или след конкурентите.

DentAI се настройва за 2 часа. Не изисква смяна на телефонния номер. Работи от първия ден.

Първите 14 дни са безплатни. Без договор.

Може ли да поговорим тази седмица?

Деян Стойчев
DentAI
📞 089 703 7079`,
  },
  {
    id: "noshow",
    label: "Шаблон 3 — Неявявания (конкретен проблем)",
    subject: "18% неявявания — как клиниките го намаляват наполовина за 30 дни",
    body: `Здравейте,

Средният процент неявявания в денталните клиники в България е около 15-20%.

За клиника с 150 часа на месец — това са 22-30 изгубени часа. При 150 лв. среден приход на час: 3 300–4 500 лв. изгубен капацитет всеки месец.

Клиниките, работещи с DentAI, намаляват неявяванията с до 54% — само чрез автоматични SMS напомняния 24 часа и 2 часа преди часа.

Никаква магия. Просто системата прави това, което рецепционистът няма физическо време да прави за всеки пациент.

Ако само половината от тези часове се запълнят отново — инвестицията в DentAI се изплаща многократно.

Искате ли да видите как работи за 15 минути? Без ангажимент.

Деян Стойчев
DentAI — AI рецепционист
📞 089 703 7079
teamsupportdentai@gmail.com`,
  },
];

interface AgentStatus {
  name: string;
  description: string;
  status: "active" | "idle" | "error";
  lastRun: string;
  nextRun: string;
}

const OUTREACH_CLINICS = [
  // SOFIA
  { name: "ЕО Дент", city: "София", phone: "0888 500 522", email: "", status: "Нов" },
  { name: "M3 Dent", city: "София", phone: "+359 87 999 12 15", email: "info@m3dent.com", status: "Нов" },
  { name: "Немска Дентална Клиника (DDK)", city: "София", phone: "+359 899 077 916", email: "office@ddk.bg", status: "Нов" },
  { name: "DmClinic", city: "София", phone: "0899 50 60 70", email: "dmclinicsofia@gmail.com", status: "Нов" },
  { name: "Медstom Dental Clinic", city: "София", phone: "+359 2 981 00 00", email: "marketing@medstom.com", status: "Нов" },
  { name: "Kavident Dental Clinic", city: "София", phone: "+359 887 92 57 37", email: "", status: "Нов" },
  { name: "Bulgaria Dent", city: "София", phone: "02 854 8016", email: "", status: "Нов" },
  { name: "B-dent", city: "София", phone: "+359 878 335 889", email: "clinic@b-dent.bg", status: "Нов" },
  { name: "MG Dental Clinic", city: "София", phone: "+359 886 103 222", email: "dentalclinicmg@gmail.com", status: "Нов" },
  { name: "Dr. Cvety", city: "София", phone: "0879 010 112", email: "info@drcvety.com", status: "Нов" },
  { name: "NuriDent", city: "София", phone: "0887 77 07 03", email: "contact@nurident.com", status: "Нов" },
  { name: "Емдент", city: "София", phone: "+359 882 306 084", email: "", status: "Нов" },
  { name: "Sofia Implant Centre", city: "София", phone: "", email: "", status: "Нов" },
  { name: "ProDent Clinic Sofia", city: "София", phone: "", email: "", status: "Нов" },
  { name: "Noradent", city: "София", phone: "", email: "", status: "Нов" },
  { name: "SF Dent", city: "София", phone: "", email: "", status: "Нов" },
  { name: "Voeva Dental", city: "София", phone: "", email: "", status: "Нов" },
  { name: "Diamond Smile", city: "София", phone: "", email: "", status: "Нов" },
  // PLOVDIV
  { name: "Superdent", city: "Пловдив", phone: "+359 32 64-84-84", email: "", status: "Нов" },
  { name: "MIG DENT Dental Center", city: "Пловдив", phone: "+359 89 342 5121", email: "", status: "Нов" },
  { name: "Dente Dental Studio", city: "Пловдив", phone: "", email: "hello@dente.bg", status: "Нов" },
  { name: "Dr Genchev", city: "Пловдив", phone: "+359 32 266 089", email: "", status: "Нов" },
  { name: "BelDent", city: "Пловдив", phone: "", email: "", status: "Нов" },
  // VARNA
  { name: "Medica 3 Dent", city: "Варна", phone: "0896 865 375", email: "", status: "Нов" },
  { name: "Dr. Boneva Dental Clinic", city: "Варна", phone: "+359 877 88 68 16", email: "drbonevadentist@abv.bg", status: "Нов" },
  { name: "iDent Dental Practice", city: "Варна", phone: "", email: "", status: "Нов" },
  { name: "Chayka Dental", city: "Варна", phone: "+359 888 310 106", email: "info@chaykadental.com", status: "Нов" },
  { name: "Farmadent Dental Centers", city: "Варна", phone: "052 647 364", email: "", status: "Нов" },
  { name: "Medicare Dental Center", city: "Варна", phone: "", email: "", status: "Нов" },
  { name: "Dr. Chaushev Dental Clinic", city: "Варна", phone: "", email: "", status: "Нов" },
  // BURGAS
  { name: "Dental Center Burgas", city: "Бургас", phone: "056/83-19-39", email: "dc1_bs@mail.bg", status: "Нов" },
  { name: "Dentamed", city: "Бургас", phone: "", email: "", status: "Нов" },
  { name: "Kuneva Dental", city: "Бургас", phone: "", email: "", status: "Нов" },
  // PLEVEN
  { name: "Dental-Smile OOD", city: "Плевен", phone: "0897 666 111", email: "", status: "Нов" },
  { name: "Tandem-Dent", city: "Плевен", phone: "0878 446 681", email: "", status: "Нов" },
  { name: "Ivadent", city: "Плевен", phone: "0887 399 890", email: "", status: "Нов" },
  { name: "Bogdanov Dental", city: "Плевен", phone: "", email: "", status: "Нов" },
  // RUSE
  { name: "Dentalna Klinika Dukovi", city: "Русе", phone: "+359 82 507 505", email: "", status: "Нов" },
  { name: "Dental Clinic Odontoya", city: "Русе", phone: "082 87 98 79", email: "", status: "Нов" },
  { name: "Dental Center 1 Ruse", city: "Русе", phone: "+359 82 82 37 97", email: "dentalruse@abv.bg", status: "Нов" },
  // SHUMEN
  { name: "MiR DENT Dental Center", city: "Шумен", phone: "0895 734 603", email: "mirdent12@gmail.com", status: "Нов" },
  { name: "NK Dental Clinic", city: "Шумен", phone: "", email: "", status: "Нов" },
  { name: "Dental Clinic DOKSA", city: "Шумен", phone: "", email: "", status: "Нов" },
  { name: "Smile Dental Clinic Shumen", city: "Шумен", phone: "", email: "", status: "Нов" },
  // DOBRICH
  { name: "Dental Cabinet Dr. Bozhilov", city: "Добрич", phone: "+359 58/82 80 65", email: "karaood@abv.bg", status: "Нов" },
  { name: "Dental Cabinet Dr. Vasilev", city: "Добрич", phone: "+359 888 63 82", email: "vasilevdent@abv.bg", status: "Нов" },
  { name: "Denta Vision OOD", city: "Добрич", phone: "0896 63 06 55", email: "", status: "Нов" },
  { name: "Smart Dent Dobrich", city: "Добрич", phone: "", email: "", status: "Нов" },
  // BLAGOEVGRAD
  { name: "City Dental Studio", city: "Благоевград", phone: "088 693 0507", email: "", status: "Нов" },
  { name: "Dental Clinic LIFE", city: "Благоевград", phone: "073 88 55 58", email: "", status: "Нов" },
  { name: "Dental Clinic Korchev", city: "Благоевград", phone: "", email: "", status: "Нов" },
  { name: "Denta Face Clinic", city: "Благоевград", phone: "", email: "", status: "Нов" },
  { name: "Dr. Tsintsarov", city: "Благоевград", phone: "", email: "", status: "Нов" },
  // STARA ZAGORA
  { name: "SD Clinic", city: "Стара Загора", phone: "", email: "sd_clinic@abv.bg", status: "Нов" },
];

const AGENTS: AgentStatus[] = [
  {
    name: "Agent 1 — Изследване",
    description: "Анализира тенденции в дентална медицина",
    status: "active",
    lastRun: "Преди 2 часа",
    nextRun: "След 22 часа",
  },
  {
    name: "Agent 2 — Създаване",
    description: "Генерира съдържание за социални мрежи",
    status: "idle",
    lastRun: "Преди 6 часа",
    nextRun: "След 18 часа",
  },
  {
    name: "Agent 3 — Публикуване",
    description: "Публикува и проследява engagement",
    status: "idle",
    lastRun: "Преди 6 часа",
    nextRun: "След 18 часа",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  idle: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  idle: "В изчакване",
  error: "Грешка",
};

export default function AdminMarketingPage() {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEmail, setActiveEmail] = useState(COLD_EMAILS[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("Всички");
  const [statusFilter, setStatusFilter] = useState<Record<string, string>>({});
  const [mainTab, setMainTab] = useState<"emails" | "clinics">("emails");

  const cities = ["Всички", ...Array.from(new Set(OUTREACH_CLINICS.map((c) => c.city)))];
  const filteredClinics = cityFilter === "Всички" ? OUTREACH_CLINICS : OUTREACH_CLINICS.filter((c) => c.city === cityFilter);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("marketing_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setPosts((data || []) as MarketingPost[]);
    setLoading(false);
  }

  const PLATFORM_LABELS: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
  };

  const POST_STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-slate-500/20 text-slate-400",
    SCHEDULED: "bg-blue-500/20 text-blue-400",
    PUBLISHED: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  const POST_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Чернова",
    SCHEDULED: "Планиран",
    PUBLISHED: "Публикуван",
    FAILED: "Грешка",
  };

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const activeTemplate = COLD_EMAILS.find((e) => e.id === activeEmail)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Маркетинг</h1>
        <p className="text-slate-400 text-sm mt-1">Cold email шаблони и AI агенти за съдържание</p>
      </div>

      {/* Cold Email Templates */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">📧 Cold Email Шаблони</h2>
            <p className="text-slate-500 text-xs mt-0.5">Изпратени към собственици на дентални клиники в България</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Тъмна психология + Sales strategy
          </span>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-white/8 overflow-x-auto">
          {COLD_EMAILS.map((email) => (
            <button
              key={email.id}
              onClick={() => setActiveEmail(email.id)}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeEmail === email.id
                  ? "text-white border-b-2 border-brand-blue bg-brand-blue/5"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {email.label.split(" — ")[0]}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wide">Тема на имейла</label>
              <button
                onClick={() => copyText(activeTemplate.subject, "subject")}
                className="text-xs text-slate-500 hover:text-brand-blue transition-colors"
              >
                {copied === "subject" ? "✓ Копирано" : "Копирай"}
              </button>
            </div>
            <div className="bg-dark-700 border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-medium">
              {activeTemplate.subject}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-500 font-medium uppercase tracking-wide">Тяло на имейла</label>
              <button
                onClick={() => copyText(activeTemplate.body, "body")}
                className="text-xs text-slate-500 hover:text-brand-blue transition-colors"
              >
                {copied === "body" ? "✓ Копирано" : "Копирай цялото"}
              </button>
            </div>
            <div className="bg-dark-700 border border-white/8 rounded-xl px-4 py-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {activeTemplate.body}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-dark-700 border border-white/8 rounded-xl p-3 text-center">
              <div className="text-green-400 text-lg font-bold">~28%</div>
              <div className="text-slate-500 text-xs mt-0.5">Open rate (цел)</div>
            </div>
            <div className="bg-dark-700 border border-white/8 rounded-xl p-3 text-center">
              <div className="text-blue-400 text-lg font-bold">~8%</div>
              <div className="text-slate-500 text-xs mt-0.5">Reply rate (цел)</div>
            </div>
            <div className="bg-dark-700 border border-white/8 rounded-xl p-3 text-center">
              <div className="text-amber-400 text-lg font-bold">~2%</div>
              <div className="text-slate-500 text-xs mt-0.5">Конверсия (цел)</div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-400 text-xs font-semibold mb-1">📋 Как да използваш шаблоните:</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Замени <strong className="text-white">[Фамилия]</strong>, <strong className="text-white">[Клиника]</strong> и <strong className="text-white">[Град]</strong> с реалните данни.
              Изпращай от <strong className="text-white">teamsupportdentai@gmail.com</strong> за по-добра доставяемост.
              Изчакай 3-4 дни преди follow-up. Максимум 2 follow-up-а.
            </p>
          </div>
        </div>
      </div>

      {/* Outreach clinic list */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-white font-semibold">🏥 Списък за Outreach ({OUTREACH_CLINICS.length} клиники)</h2>
            <p className="text-slate-500 text-xs mt-0.5">Дентални клиники в България — готови за cold email кампания</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  cityFilter === city
                    ? "bg-brand-blue text-white"
                    : "bg-dark-700 text-slate-400 hover:text-white border border-white/8"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-dark-700/50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">#</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Клиника</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Град</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Телефон</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Имейл</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClinics.map((clinic, i) => {
                const key = `${clinic.name}-${clinic.city}`;
                const status = statusFilter[key] || clinic.status;
                const statusColors: Record<string, string> = {
                  "Нов": "bg-slate-500/20 text-slate-400",
                  "Изпратен": "bg-blue-500/20 text-blue-400",
                  "Отговорил": "bg-green-500/20 text-green-400",
                  "Неинтересен": "bg-red-500/20 text-red-400",
                };
                return (
                  <tr key={key} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{clinic.name}</td>
                    <td className="px-4 py-3 text-slate-400">{clinic.city}</td>
                    <td className="px-4 py-3">
                      {clinic.phone ? (
                        <a href={`tel:${clinic.phone.replace(/\s/g, "")}`} className="text-brand-blue hover:text-blue-400 transition-colors text-xs">
                          {clinic.phone}
                        </a>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {clinic.email ? (
                        <a href={`mailto:${clinic.email}`} className="text-brand-blue hover:text-blue-400 transition-colors text-xs">
                          {clinic.email}
                        </a>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={(e) => setStatusFilter((prev) => ({ ...prev, [key]: e.target.value }))}
                        className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColors[status] || "bg-slate-500/20 text-slate-400"}`}
                      >
                        <option value="Нов">Нов</option>
                        <option value="Изпратен">Изпратен</option>
                        <option value="Отговорил">Отговорил</option>
                        <option value="Неинтересен">Неинтересен</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/8 flex items-center justify-between">
          <p className="text-slate-500 text-xs">Показани: {filteredClinics.length} клиники</p>
          <p className="text-slate-600 text-xs">Статусите се запазват само за тази сесия — добави база данни за постоянно съхранение</p>
        </div>
      </div>

      {/* Agent status panels */}
      <div className="grid md:grid-cols-3 gap-4">
        {AGENTS.map((agent, i) => (
          <div key={i} className="bg-dark-800 border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-medium text-sm">{agent.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{agent.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[agent.status]}`}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p>Последно: {agent.lastRun}</p>
              <p>Следващо: {agent.nextRun}</p>
            </div>
            {agent.status === "active" && (
              <div className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green animate-shimmer" style={{ width: "60%" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Posts list */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold">Съдържание ({posts.length})</h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-slate-400">Няма публикувано съдържание</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-white/2 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-slate-500 text-xs">{PLATFORM_LABELS[post.platform]}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">
                        {post.scheduled_for ? formatDateTime(post.scheduled_for) : formatDateTime(post.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${POST_STATUS_COLORS[post.status]}`}>
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                </div>
                {post.engagement_metrics && Object.keys(post.engagement_metrics).length > 0 && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    {post.engagement_metrics.likes && <span>❤️ {post.engagement_metrics.likes}</span>}
                    {post.engagement_metrics.comments && <span>💬 {post.engagement_metrics.comments}</span>}
                    {post.engagement_metrics.shares && <span>↗️ {post.engagement_metrics.shares}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
