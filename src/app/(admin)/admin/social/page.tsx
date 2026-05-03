"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Send, Clock, Trash2, Plus, RefreshCw, Facebook, Instagram, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";
type PostStatus = "pending" | "published" | "rejected" | "scheduled" | "failed";

interface SocialPost {
  id: string;
  content: string;
  platforms: Platform[];
  category: string;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  facebook: <Facebook size={13} />,
  instagram: <Instagram size={13} />,
  linkedin: <Linkedin size={13} />,
  tiktok: <span className="text-[10px] font-black">TT</span>,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-pink-500 to-purple-600",
  linkedin: "bg-blue-500",
  tiktok: "bg-dark-900 border border-white/20",
};

const ALL_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin", "tiktok"];

const AI_POSTS = [
  { category: "Вирален", content: "В момента, в който четете това, вашата клиника пропуска обаждане. 📞\n\nAI рецепционистът на DentAI отговаря вместо вас — 24/7, на перфектен български.\n\n#DentAI #AIРецепционист #стоматология #дентална" },
  { category: "Вирален", content: "Позвъних на 20 клиники в София след 20:00 часа.\n\n17 от тях: никой не отговори.\n2: автоматичен секретар.\n1: AI рецепционист, записа ме за 47 секунди. 🤖\n\nПознайте коя клиника спечели пациента?\n\n#DentAI #стоматология #AI" },
  { category: "Сравнение", content: "Рецепционист: 1,400 лв./месец. Работи 8 часа.\nDentAI: 199 лв./месец. Работи 24 часа. 🔥\n\nИзборът е очевиден.\n\n#DentAI #AIРецепционист #стоматологичнаклиника" },
  { category: "Вирален", content: "Докато спяхте тази нощ... 🌙\n\nDentAI отговори на 4 обаждания.\nЗаписа 3 пациента.\nИзпрати 3 напомняния.\nСпести 2 часа административна работа.\n\nЛека нощ. 😴\n\n#DentAI #автоматизация #стоматология" },
  { category: "FOMO", content: "Вашият конкурент тъкмо монтира AI рецепционист. 😬\n\nТой ще отговаря в 23:00.\nТой ще записва в събота.\nТой ще взима вашите пациенти.\n\nА вие?\n\n#DentAI #стоматология #иновации" },
  { category: "Болка", content: "62% от пациентите НЕ перезвъняват. 📊\n\nВсяко пропуснато обаждане = загубен пациент = загубени пари.\n\nКолко сте изгубили само тази седмица?\n\n#DentAI #стоматологичнаклиника #AIРецепционист" },
  { category: "Демо", content: "Гледайте как AI записва пациент в 22:47 без никакъв човек. 🤖\n\nТова се случва всяка нощ в клиниките с DentAI.\n\n#DentAI #AI #стоматология" },
  { category: "Болка", content: "Спрете да търсите нова рецепционистка. 🛑\n\nПроблемът не е тя.\nПроблемът е, че клиниката не може да работи 24/7.\n\nDentAI може.\n\n#DentAI #AIРецепционист #дентална" },
  { category: "Резултати", content: "Преди DentAI: 38 нови пациента на месец.\nСлед DentAI: 54. 📈\n\nБез нов персонал. Без реклама.\n\n#резултати #дентална #DentAI" },
  { category: "Социално", content: "\"Само двама пациента ме попитаха дали говорят с робот.\nЕдиният каза, че е по-учтив от някои рецепционисти.\" 😄\n\n— Д-р К.Г., Пловдив\n\n#DentAI #отзив #стоматология" },
  { category: "Образование", content: "Как работи AI рецепционистът? 🤔\n\n1️⃣ Пациентът звъни\n2️⃣ DentAI отговаря на естествен български\n3️⃣ Проверява календара\n4️⃣ Записва час\n5️⃣ Изпраща SMS потвърждение\n\nВсичко за под 3 минути. Без ваша намеса.\n\n#DentAI #AI #стоматология" },
  { category: "FOMO", content: "Новата норма за денталните клиники:\n\n2023: Рецепционист на телефона\n2024: Смесен модел\n2025: AI отговаря, хората се грижат за пациентите ✅\n\nВ коя група сте вие?\n\n#DentAI #иновации #стоматология" },
  { category: "Цена", content: "Изчислихме:\n\n10 пропуснати обаждания/ден\n× 30% нови пациенти\n× 200 лв. средна стойност\n× 250 работни дни\n\n= 150,000 лв./год изгубени 💸\n\nDentAI: 199 лв./месец.\n\n#DentAI #стоматология #математика" },
  { category: "Нощ", content: "В 23:47 миналата нощ пациент се обади в клиника в Варна.\n\nDentAI отговори.\nЧасът е записан.\nВие спяхте спокойно. 🌙\n\n#DentAI #стоматология #24_7" },
  { category: "Социално", content: "Д-р Стефан от Варна:\n\n\"Откакто имам DentAI, не съм пропуснал нито едно записване.\nРаботя по-малко стресирано.\nИ клиниката ми расте.\"\n\n#DentAI #зъболекар #резултати" },
];

export default function AdminSocialPage() {
  const [tab, setTab] = useState<"pending" | "published" | "compose" | "library">("pending");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([...ALL_PLATFORMS]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPosts = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts?status=${status}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "pending") fetchPosts("pending");
    else if (tab === "published") fetchPosts("published");
  }, [tab, fetchPosts]);

  async function approve(post: SocialPost) {
    setApproving(post.id);
    try {
      const res = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: post.content, platforms: post.platforms, postId: post.id }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        notify("success", "Постът е публикуван успешно! ✅");
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } else {
        notify("error", "Грешка при публикуване.");
      }
    } catch {
      notify("error", "Неочаквана грешка.");
    } finally {
      setApproving(null);
    }
  }

  async function reject(id: string) {
    await fetch(`/api/social/posts?id=${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    notify("success", "Постът е отхвърлен.");
  }

  async function queuePost(text: string, category: string) {
    const res = await fetch("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, platforms: ALL_PLATFORMS, category, status: "pending" }),
    });
    if (res.ok) {
      notify("success", "Постът е добавен за преглед!");
      setTab("pending");
    }
  }

  async function saveCompose() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
          status: scheduledAt ? "scheduled" : "pending",
          scheduledAt: scheduledAt || null,
        }),
      });
      if (res.ok) {
        notify("success", scheduledAt ? "Планиран успешно!" : "Добавен за одобрение!");
        setContent("");
        setScheduledAt("");
        setTab("pending");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Социални мрежи</h1>
          <p className="text-slate-400 text-sm mt-0.5">Прегледай и одобри постовете с 1 клик</p>
        </div>
        <button
          onClick={() => setTab("compose")}
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={15} />
          Нов пост
        </button>
      </div>

      {notification && (
        <div className={cn(
          "px-4 py-3 rounded-xl text-sm font-medium",
          notification.type === "success"
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {notification.text}
        </div>
      )}

      <div className="flex gap-1 bg-dark-800 border border-white/8 rounded-xl p-1">
        {([
          { key: "pending", label: "За одобрение", emoji: "👀" },
          { key: "library", label: "AI Библиотека", emoji: "🤖" },
          { key: "compose", label: "Напиши", emoji: "✍️" },
          { key: "published", label: "Публикувани", emoji: "✅" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all",
              tab === t.key ? "bg-brand-purple text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="space-y-4">
          {loading && [1, 2].map((i) => (
            <div key={i} className="bg-dark-800 border border-white/8 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-dark-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-dark-700 rounded w-full mb-2" />
              <div className="h-3 bg-dark-700 rounded w-2/3" />
            </div>
          ))}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16 bg-dark-800 border border-white/8 rounded-2xl">
              <div className="text-4xl mb-3">👀</div>
              <p className="text-white font-semibold mb-1">Няма постове за преглед</p>
              <p className="text-slate-500 text-sm mb-5">Избери пост от AI Библиотеката или напиши свой</p>
              <button
                onClick={() => setTab("library")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-purple hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Отиди в библиотеката →
              </button>
            </div>
          )}

          {!loading && posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-0 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{post.category}</span>
                <div className="flex gap-1">
                  {post.platforms.map((p) => (
                    <span key={p} className={cn("w-5 h-5 rounded flex items-center justify-center text-white text-xs", PLATFORM_COLORS[p])}>
                      {PLATFORM_ICONS[p]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
              <div className="flex border-t border-white/8">
                <button
                  onClick={() => reject(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium"
                >
                  <XCircle size={18} /> Откажи
                </button>
                <div className="w-px bg-white/8" />
                <button
                  onClick={() => approve(post)}
                  disabled={approving === post.id}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-brand-green hover:bg-green-500/10 disabled:opacity-50 transition-all text-sm font-bold"
                >
                  {approving === post.id ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {approving === post.id ? "Публикува се..." : "Одобри и публикувай"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "library" && (
        <div className="space-y-3">
          <p className="text-slate-500 text-sm">Кликни на пост → добавя се за преглед → одобри и публикувай.</p>
          {AI_POSTS.map((post, i) => (
            <div
              key={i}
              onClick={() => queuePost(post.content, post.category)}
              className="group bg-dark-800 border border-white/8 hover:border-brand-purple/40 rounded-xl p-4 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-brand-purple font-medium mb-1.5 block">{post.category}</span>
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-purple/10 group-hover:bg-brand-purple/20 flex items-center justify-center transition-all">
                  <Plus size={14} className="text-brand-purple" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "compose" && (
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Напиши пост</h3>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Платформи</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatforms((prev) =>
                    prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                  )}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    selectedPlatforms.includes(p)
                      ? `${PLATFORM_COLORS[p]} text-white`
                      : "bg-dark-700 text-slate-400 border border-white/10 hover:text-white"
                  )}
                >
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напишете съдържанието..."
            rows={7}
            className="w-full px-4 py-3 bg-dark-700 border border-white/10 text-white placeholder-slate-600 text-sm rounded-xl outline-none focus:border-brand-purple transition-colors resize-none"
          />
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Планирай за (незадължително)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="px-3 py-2 bg-dark-700 border border-white/10 text-white text-sm rounded-xl outline-none focus:border-brand-purple transition-colors"
            />
          </div>
          <button
            onClick={saveCompose}
            disabled={saving || !content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : scheduledAt ? <Clock size={14} /> : <Send size={14} />}
            {scheduledAt ? "Планирай" : "Добави за преглед"}
          </button>
        </div>
      )}

      {tab === "published" && (
        <div className="space-y-3">
          <button onClick={() => fetchPosts("published")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Обнови
          </button>
          {!loading && posts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-3xl mb-2">📭</div>
              <p>Все още няма публикувани постове</p>
            </div>
          )}
          {posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-white/8 rounded-xl p-4">
              <p className="text-slate-300 text-sm line-clamp-3 whitespace-pre-wrap mb-3">{post.content}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-green-400"><CheckCircle size={11} /> Публикуван</span>
                {post.published_at && <span>{new Date(post.published_at).toLocaleString("bg-BG")}</span>}
                <button onClick={() => reject(post.id)} className="ml-auto text-red-400/50 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
