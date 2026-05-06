import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Блог | DentAI",
  description: "Полезни статии за дентални клиники — AI рецепционист, управление на практика, маркетинг.",
};

const STATIC_POSTS = [
  {
    slug: "zagubeni-patsienti-sled-18",
    title: "Защо вашата дентална клиника губи пациенти всяка вечер след 18:00",
    excerpt: "Средната дентална клиника пропуска между 8 и 15 обаждания дневно извън работно време. Изчислете колко ви струва мълчанието.",
    published_at: "2025-04-29",
    read_time_minutes: 5,
    category: "Бизнес",
  },
  {
    slug: "ai-vs-traditsionen-retseptsionist",
    title: "AI рецепционист vs. Традиционен рецепционист: Пълното сравнение за 2025",
    excerpt: "Честно сравнение на разходи, предимства и недостатъци. Не е едното или другото — оптималното за повечето клиники е комбинацията.",
    published_at: "2025-04-28",
    read_time_minutes: 6,
    category: "Сравнение",
  },
  {
    slug: "40-procenta-poveke-zapisvaniya",
    title: "Как денталните клиники увеличават записванията с 40% без допълнителен персонал",
    excerpt: "Реален казус: клиника в Пловдив с 127 пропуснати обаждания месечно — и как реши проблема за 30 дни.",
    published_at: "2025-04-26",
    read_time_minutes: 4,
    category: "Казус",
  },
  {
    slug: "5-priznaka-gotovi-za-ai",
    title: "5 признака, че вашата клиника е готова за AI рецепционист",
    excerpt: "Не всяка клиника има нужда от AI точно сега. Ето как да разберете дали е правилният момент за вас.",
    published_at: "2025-04-24",
    read_time_minutes: 3,
    category: "Ръководство",
  },
  {
    slug: "kakvo-e-ai-retseptsionist",
    title: "Какво е AI рецепционист и как работи? (Пълното ръководство за зъболекари)",
    excerpt: "Обяснение без жаргон — как работи технологията, какво НЕ е, и защо все повече клиники я използват.",
    published_at: "2025-04-22",
    read_time_minutes: 5,
    category: "Образование",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Бизнес": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Сравнение": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Казус": "bg-green-500/10 text-green-400 border-green-500/20",
  "Ръководство": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Образование": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "AI & Иновации": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Бизнес съвети": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Финанси": "bg-green-500/10 text-green-400 border-green-500/20",
  "Маркетинг": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Технологии": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Тенденции": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Стратегия": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Истории": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Психология на продажбите": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

interface PostItem {
  slug: string;
  title: string;
  excerpt: string;
  published_at: string;
  read_time_minutes: number;
  category: string;
}

async function getDbPosts(): Promise<PostItem[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, published_at, read_time_minutes, category")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);
    return (data || []) as PostItem[];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const dbPosts = await getDbPosts();
  // Merge: DB posts first, then static ones not already in DB
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const staticFallback = STATIC_POSTS.filter((p) => !dbSlugs.has(p.slug));
  const allPosts: PostItem[] = [...dbPosts, ...staticFallback];

  return (
    <main className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-sm font-medium mb-4">
            БЛОГ
          </span>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">
            Полезни статии за дентални клиники
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            AI рецепционисти, управление на практика и растеж без допълнителен персонал.
          </p>
        </div>

        <div className="space-y-6">
          {allPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-dark-800 border border-white/8 hover:border-brand-blue/30 rounded-2xl p-6 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CATEGORY_COLORS[post.category] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(post.published_at)}</span>
                      <span className="text-xs text-slate-500">· {post.read_time_minutes} мин четене</span>
                    </div>
                    <h2 className="text-white font-heading font-bold text-xl mb-2 group-hover:text-brand-blue transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0 mt-1">
                    →
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
          >
            ← Към началото
          </Link>
        </div>
      </div>
    </main>
  );
}
