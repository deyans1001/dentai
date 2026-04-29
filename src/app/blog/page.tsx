import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Блог | DentAI",
  description: "Полезни статии за дентални клиники — AI рецепционист, управление на практика, маркетинг.",
};

const POSTS = [
  {
    slug: "zagubeni-patsienti-sled-18",
    title: "Защо вашата дентална клиника губи пациенти всяка вечер след 18:00",
    excerpt: "Средната дентална клиника пропуска между 8 и 15 обаждания дневно извън работно време. Изчислете колко ви струва мълчанието.",
    date: "29 Април 2025",
    readTime: "5 мин",
    category: "Бизнес",
  },
  {
    slug: "ai-vs-traditsionen-retseptsionist",
    title: "AI рецепционист vs. Традиционен рецепционист: Пълното сравнение за 2025",
    excerpt: "Честно сравнение на разходи, предимства и недостатъци. Не е едното или другото — оптималното за повечето клиники е комбинацията.",
    date: "28 Април 2025",
    readTime: "6 мин",
    category: "Сравнение",
  },
  {
    slug: "40-procenta-poveke-zapisvaniya",
    title: "Как денталните клиники увеличават записванията с 40% без допълнителен персонал",
    excerpt: "Реален казус: клиника в Пловдив с 127 пропуснати обаждания месечно — и как реши проблема за 30 дни.",
    date: "26 Април 2025",
    readTime: "4 мин",
    category: "Казус",
  },
  {
    slug: "5-priznaka-gotovi-za-ai",
    title: "5 признака, че вашата клиника е готова за AI рецепционист",
    excerpt: "Не всяка клиника има нужда от AI точно сега. Ето как да разберете дали е правилният момент за вас.",
    date: "24 Април 2025",
    readTime: "3 мин",
    category: "Ръководство",
  },
  {
    slug: "kakvo-e-ai-retseptsionist",
    title: "Какво е AI рецепционист и как работи? (Пълното ръководство за зъболекари)",
    excerpt: "Обяснение без жаргон — как работи технологията, какво НЕ е, и защо все повече клиники я използват.",
    date: "22 Април 2025",
    readTime: "5 мин",
    category: "Образование",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Бизнес": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Сравнение": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Казус": "bg-green-500/10 text-green-400 border-green-500/20",
  "Ръководство": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Образование": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function BlogPage() {
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
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-dark-800 border border-white/8 hover:border-brand-blue/30 rounded-2xl p-6 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CATEGORY_COLORS[post.category]}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500">{post.date}</span>
                      <span className="text-xs text-slate-500">· {post.readTime} четене</span>
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
