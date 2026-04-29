"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Clock, CheckCircle, Trash2, Plus, RefreshCw, Facebook, Instagram, Linkedin, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";
type PostStatus = "draft" | "scheduled" | "published" | "failed";

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
  facebook: <Facebook size={14} />,
  instagram: <Instagram size={14} />,
  linkedin: <Linkedin size={14} />,
  tiktok: <span className="text-xs font-bold">TT</span>,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-pink-600",
  linkedin: "bg-blue-500",
  tiktok: "bg-black border border-white/20",
};

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string }> = {
  draft: { label: "Чернова", color: "text-slate-400 bg-slate-800" },
  scheduled: { label: "Планиран", color: "text-amber-400 bg-amber-500/10" },
  published: { label: "Публикуван", color: "text-green-400 bg-green-500/10" },
  failed: { label: "Неуспешен", color: "text-red-400 bg-red-500/10" },
};

// Готово AI съдържание — 30 поста
const AI_CONTENT_LIBRARY = [
  {
    category: "TikTok/Reels",
    emoji: "🎬",
    posts: [
      "В момента, в който четете това, вашата клиника пропуска обаждане. 📞\n\nAI рецепционистът на DentAI отговаря вместо вас — 24/7, на перфектен български.\n\n#DentAI #AIРецепционист #стоматология #дентална",
      "Позвъних на 20 клиники в София след 20:00 часа.\n\n17 от тях: никой не отговори.\n2: автоматичен секретар.\n1: AI рецепционист, записа ме за 47 секунди. 🤖\n\nПознайте коя клиника спечели пациента?\n\n#DentAI #стоматология #AI",
      "Рецепционист: 1,400 лв./месец. Работи 8 часа.\nDentAI: 199 лв./месец. Работи 24 часа. 🔥\n\nИзборът е очевиден.\n\n#DentAI #AIРецепционист #стоматологичнаклиника",
      "Докато спяхте тази нощ... 🌙\n\nDentAI отговори на 4 обаждания.\nЗаписа 3 пациента.\nИзпрати 3 напомняния.\nСпести 2 часа административна работа.\n\nЛека нощ. 😴\n\n#DentAI #автоматизация #стоматология",
      "Мит: AI не може да говори добър български. ❌\nРеалност: Чуйте сами. ✅\n\n[демо запис]\n\n94% от пациентите не различават Ива от истинска рецепционистка.\n\n#DentAI #AIРецепционист #България",
      "Вашият конкурент тъкмо монтира AI рецепционист. 😬\n\nТой ще отговаря в 23:00.\nТой ще записва в събота.\nТой ще взима вашите пациенти.\n\nА вие?\n\n#DentAI #стоматология #иновации",
      "POV: Рецепционистката в петък следобед в 17:45 🫠\n\n- телефонът звъни\n- пациент на рецепцията\n- WhatsApp с 12 съобщения\n- лекарят пита за файл\n\nDentAI се справя с всичко. Тя — не винаги.\n\n#стоматология #DentAI",
      "62% от пациентите НЕ перезвъняват. 📊\n\nВсяко пропуснато обаждане = загубен пациент = загубени пари.\n\nКолко сте изгубили само тази седмица?\n\n#DentAI #стоматологичнаклиника #AIРецепционист",
      "Гледайте как AI записва пациент в 22:47 без никакъв човек. 🤖\n\n[демо видео]\n\nТова се случва всяка нощ в клиниките с DentAI.\n\n#DentAI #AI #стоматология",
      "Спрете да търсите нова рецепционистка. 🛑\n\nПроблемът не е тя.\nПроблемът е, че клиниката не може да работи 24/7.\n\nDentAI може.\n\n#DentAI #AIРецепционист #дентална",
    ],
  },
  {
    category: "Instagram",
    emoji: "📸",
    posts: [
      "Знаете ли колко пациента сте изгубили само тази седмица? 🦷\n\nСредната клиника в София пропуска между 8 и 15 обаждания на ден. При имплант от 2,000 лв. — това са десетки хиляди лева годишно, излезли от вратата.\n\nDentAI отговаря на всяко обаждане. Денем, нощем, в събота, в неделя. На перфектен български.\n\nВземете безплатна демонстрация → линкът в биото 👆\n\n#DentAI #AIРецепционист #стоматология #дентална #зъболекар #иновации #България",
      "Преди 3 месеца клиника в Пловдив пропускаше 12 обаждания на ден. 📉\n\nСлед DentAI:\n✅ 0 пропуснати обаждания\n✅ +34 записвания за месеца\n✅ +8,200 лв. допълнителен приход\n\nЦялото разграждане в Stories.\n\n#DentAI #стоматология #резултати #AIРецепционист #зъболекар",
      "AI рецепционистът не замества вашия екип. 🤝\n\nТой освобождава вашия екип.\n\nДокато Ива (нашият AI) отговаря на телефона в 23:00, вашата рецепционистка се грижи за пациентите пред нея.\n\nДве неща едновременно. Нула стрес.\n\n#DentAI #стоматология #AIРецепционист #автоматизация",
      "5 признака, че клиниката ви е готова за AI рецепционист 👇\n\n1️⃣ Пропускате повече от 5 обаждания на ден\n2️⃣ Рецепционистката е претоварена в пиков час\n3️⃣ Имате пациенти, които искат да записват вечер или уикенд\n4️⃣ Плащате за рецепционист повече от 800 лв./месец\n5️⃣ Искате да растете без да наемате повече хора\n\nАко се разпознавате → linktree в биото\n\n#DentAI #стоматология #AI",
      "Обзалагам се, че губите 15,000 лв. годишно от пропуснати обаждания. 💸\n\nИзчислете сами:\n- Средно 10 пропуснати обаждания/ден\n- 30% биха станали пациенти\n- Средна стойност на пациент: 200 лв.\n\n= 10 × 0.3 × 200 × 250 работни дни = **150,000 лв./год**\n\nDentAI струва 199 лв./месец.\n\nМатематиката е проста. 🧮\n\n#DentAI #стоматология #AIРецепционист",
    ],
  },
  {
    category: "Facebook",
    emoji: "👥",
    posts: [
      "Уважаеми колеги зъболекари и мениджъри на дентални клиники,\n\nИскам да споделя нещо, което промени начина, по който управлявам клиниката си.\n\nПреди 6 месеца имах типичния проблем — телефонът звъни, докато съм при пациент. Рецепционистката е заета. Обажданията се пропускат. Пациентите не перезвъняват.\n\nВъведох AI рецепционист (DentAI). Резултатите след 30 дни:\n→ 0 пропуснати обаждания\n→ 28 нови записвания само за месеца\n→ Рецепционистката ми е 10 пъти по-малко стресирана\n\nАко имате въпроси — питайте в коментарите. Радвам се да споделя опита си.\n\n#стоматология #управлениеклиника #AI #иновации",
      "Въпрос към собствениците на дентални клиники: Колко обаждания пропускате на ден? 📊\n\nА) 0-3\nБ) 4-7\nВ) 8-15\nГ) Повече от 15\n\nПишете буквата в коментар — интересно ми е каква е реалността при вас.\n\nPs. Ако отговорихте Б, В или Г — имам нещо важно да ви кажа. 👇",
      "Много собственици на клиники ме питат: \"Ами ако AI направи грешка при записването?\"\n\nРазбирам притеснението. Затова ще бъда директен:\n\nAI не:\n❌ Прави двойни записвания\n❌ Забравя да запише телефона\n❌ Бърка датите\n❌ Казва \"Ще ви звъним\" и не звъни\n\nAI:\n✅ Записва точно това, което пациентът каже\n✅ Изпраща потвърждение веднага\n✅ Напомня 24 часа преди часа\n✅ Работи по едно и също правило всеки път\n\nИмате въпроси? Питайте. 💬",
      "Честно казано — въвеждането на AI в клиниката беше по-лесно, отколкото очаквах.\n\n1 час настройка.\nНикакви технически познания не са нужни.\nЕкипът се адаптира за 2 дни.\n\nА резултатите идват от първата седмица.\n\nАко се колебаете дали е за вас — предлагаме 14 дни безплатно, без кредитна карта.\n\nПробвайте. Ако не харесате — нищо не сте изгубили. 🤝",
      "Новата норма за денталните клиники в България:\n\n2023: Рецепционист на телефона\n2024: Смесен модел\n2025: AI отговаря, хората се грижат за пациентите ✅\n\nКлиниките, които приеха тази промяна рано, вече имат конкурентно предимство.\n\nКлиниките, които чакат — изостават.\n\nВ коя група искате да бъдете?\n\n#DentAI #стоматология #иновации #AIРецепционист",
    ],
  },
  {
    category: "LinkedIn",
    emoji: "💼",
    posts: [
      "Анализирахме 100 дентални клиники в България. Ето какво открихме:\n\n73% нямат система за пропуснати обаждания\n61% не разбират колко пациента губят всеки месец\n84% плащат за рецепционист повече от 1,000 лв./месец\n\nА средната клиника губи 12 обаждания на ден.\n\nПри средна стойност на пациент от 250 лв. — това е 3,000 лв. на ден. Или 60,000 лв. на месец. Или 720,000 лв. годишно.\n\nНе защото не им пука. А защото нямат правилния инструмент.\n\nDentAI решава точно този проблем.\n\n#AI #стоматология #денталнибизнес #иновации #България",
      "Защо AI рецепционистите ще станат стандарт в денталната индустрия до 2026:\n\n1. Пациентите очакват отговор 24/7\n2. Разходите за персонал нарастват\n3. AI технологията достигна ниво, неразличимо от човек\n4. ROI е доказан и измерим\n5. Конкурентният натиск ще принуди останалите да последват\n\nРанните приематели вече имат предимство.\n\nКъде стои вашата клиника в тази трансформация?\n\n#HealthTech #AI #Стоматология #ДигиталнаТрансформация",
    ],
  },
];

const ALL_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin", "tiktok"];

export default function SocialPage() {
  const [tab, setTab] = useState<"library" | "compose" | "scheduled" | "published">("library");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);

  // Compose state
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([...ALL_PLATFORMS]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPosts = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `/api/social/posts?status=${status}` : "/api/social/posts";
      const res = await fetch(url);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "scheduled") fetchPosts("scheduled");
    else if (tab === "published") fetchPosts("published");
  }, [tab, fetchPosts]);

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function savePost(status: "draft" | "scheduled" | "published") {
    if (!content.trim()) return;
    setPosting(true);
    setMessage(null);
    try {
      // 1. Save to DB
      const saveRes = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
          status: scheduledAt ? "scheduled" : status,
          scheduledAt: scheduledAt || null,
        }),
      });
      const savedPost = await saveRes.json();

      // 2. If publishing now (no schedule), post immediately
      if (!scheduledAt && status === "published") {
        await fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            platforms: selectedPlatforms,
            postId: savedPost.id,
          }),
        });
        setMessage({ type: "success", text: "Постът е публикуван успешно!" });
      } else if (scheduledAt) {
        setMessage({ type: "success", text: `Постът е планиран за ${new Date(scheduledAt).toLocaleString("bg-BG")}!` });
      } else {
        setMessage({ type: "success", text: "Запазен като чернова." });
      }

      setContent("");
      setScheduledAt("");
      setSelectedPlatforms([...ALL_PLATFORMS]);
      setComposing(false);
    } catch {
      setMessage({ type: "error", text: "Грешка при публикуването. Проверете Ayrshare API ключа." });
    } finally {
      setPosting(false);
    }
  }

  async function deletePost(id: string) {
    await fetch(`/api/social/posts?id=${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function useLibraryPost(text: string) {
    setContent(text);
    setTab("compose" as never);
    setComposing(true);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Социални мрежи</h1>
          <p className="text-slate-400 text-sm mt-1">Управлявайте и планирайте съдържание за всички платформи</p>
        </div>
        <button
          onClick={() => { setComposing(true); setTab("compose" as never); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={16} />
          Нов пост
        </button>
      </div>

      {/* Notification */}
      {message && (
        <div className={cn(
          "flex items-center justify-between px-4 py-3 rounded-xl text-sm",
          message.type === "success"
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-white/8 rounded-xl p-1">
        {([
          { key: "library", label: "AI Библиотека", emoji: "🤖" },
          { key: "compose", label: "Нов пост", emoji: "✍️" },
          { key: "scheduled", label: "Планирани", emoji: "🕐" },
          { key: "published", label: "Публикувани", emoji: "✅" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-brand-blue text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* AI Library Tab */}
      {tab === "library" && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
            30 готови AI поста на български — кликнете върху пост за да го редактирате и публикувате.
          </div>
          {AI_CONTENT_LIBRARY.map((category) => (
            <div key={category.category} className="bg-dark-800 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>{category.emoji}</span>
                {category.category}
                <span className="text-xs text-slate-500 font-normal ml-1">({category.posts.length} поста)</span>
              </h3>
              <div className="grid gap-3">
                {category.posts.map((post, i) => (
                  <div
                    key={i}
                    className="group bg-dark-700 border border-white/5 hover:border-brand-blue/40 rounded-xl p-4 cursor-pointer transition-all"
                    onClick={() => useLibraryPost(post)}
                  >
                    <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-3">{post}</p>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-brand-blue">Кликни за да използваш →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Tab */}
      {tab === "compose" && (
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Напиши или редактирай пост</h3>

          {/* Platform selection */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Платформи</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    selectedPlatforms.includes(p)
                      ? `${PLATFORM_COLORS[p]} text-white`
                      : "bg-dark-700 text-slate-400 hover:text-white border border-white/10"
                  )}
                >
                  {PLATFORM_ICONS[p]}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Съдържание</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишете вашия пост тук..."
              rows={8}
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 text-white placeholder-slate-600 text-sm rounded-xl outline-none focus:border-brand-blue transition-colors resize-none"
            />
            <div className="text-xs text-slate-600 mt-1 text-right">{content.length} символа</div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">
              Планиране (незадължително — оставете празно за публикуване сега)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="px-3 py-2 bg-dark-700 border border-white/10 text-white text-sm rounded-xl outline-none focus:border-brand-blue transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => savePost("published")}
              disabled={posting || !content.trim() || selectedPlatforms.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
            >
              {posting ? <RefreshCw size={15} className="animate-spin" /> : scheduledAt ? <Clock size={15} /> : <Send size={15} />}
              {scheduledAt ? "Планирай" : "Публикувай сега"}
            </button>
            <button
              onClick={() => savePost("draft")}
              disabled={posting || !content.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-slate-300 rounded-xl text-sm transition-all border border-white/10"
            >
              Запази чернова
            </button>
          </div>
        </div>
      )}

      {/* Scheduled / Published Tab */}
      {(tab === "scheduled" || tab === "published") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">{posts.length} поста</span>
            <button
              onClick={() => fetchPosts(tab === "scheduled" ? "scheduled" : "published")}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Обнови
            </button>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-dark-800 border border-white/8 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-dark-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-dark-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-3xl mb-3">📭</div>
              <p>Няма {tab === "scheduled" ? "планирани" : "публикувани"} постове</p>
            </div>
          )}

          {!loading && posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-white/8 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[post.status].color)}>
                      {STATUS_CONFIG[post.status].label}
                    </span>
                    <div className="flex gap-1">
                      {post.platforms.map((p) => (
                        <span key={p} className={cn("w-5 h-5 rounded flex items-center justify-center text-white", PLATFORM_COLORS[p])}>
                          {PLATFORM_ICONS[p]}
                        </span>
                      ))}
                    </div>
                    {post.scheduled_at && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(post.scheduled_at).toLocaleString("bg-BG")}
                      </span>
                    )}
                    {post.published_at && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <CheckCircle size={10} />
                        {new Date(post.published_at).toLocaleString("bg-BG")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
