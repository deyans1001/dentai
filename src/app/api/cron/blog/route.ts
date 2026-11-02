import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { groqChat } from "@/lib/ai/groq";

const ADMIN_EMAIL = "deyan.s1001@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app";

// 4 пъти седмично: Пон(1), Ср(3), Пет(5), Нед(0)
const PUBLISH_DAYS = [0, 1, 3, 5];

const BLOG_TOPICS = [
  // За AI и дентални клиники
  { title: "Как AI рецепционистът спести 3 часа на ден на дентална клиника в София", category: "AI & Иновации", tags: ["AI", "рецепционист", "автоматизация"] },
  { title: "5 причини защо денталните клиники в България губят пациенти след работно време", category: "Бизнес съвети", tags: ["пациенти", "обаждания", "дентална клиника"] },
  { title: "ChatGPT vs AI рецепционист: Кое е по-добро за дентална клиника?", category: "AI & Иновации", tags: ["AI", "сравнение", "технологии"] },
  { title: "Колко струва пропуснато обаждане в денталната клиника? Изчислихме го.", category: "Финанси", tags: ["ROI", "загуби", "обаждания"] },
  { title: "Как да увеличите броя на пациентите без да наемате нов персонал", category: "Бизнес съвети", tags: ["растеж", "автоматизация", "пациенти"] },
  { title: "Google Calendar + дентална клиника: Автоматизирайте записванията", category: "Технологии", tags: ["Google Calendar", "записване", "автоматизация"] },
  { title: "Реалната история: Клиника от Пловдив увеличи приходите с 40% за 3 месеца", category: "Истории", tags: ["резултати", "Пловдив", "успех"] },
  { title: "SMS напомняния за часове: Защо намаляват пропуснатите визити с 60%", category: "Бизнес съвети", tags: ["SMS", "напомняния", "пациенти"] },
  { title: "Дигитална трансформация в стоматологията: Какво се случва в България", category: "Тенденции", tags: ["дигитализация", "България", "стоматология"] },
  { title: "Как да се справите с недоволен пациент — и да го превърнете в лоялен клиент", category: "Бизнес съвети", tags: ["пациенти", "лоялност", "комуникация"] },
  { title: "Защо 73% от пациентите избират клиника, която отговаря първа на обаждането", category: "Психология на продажбите", tags: ["конверсия", "психология", "продажби"] },
  { title: "AI асистент за дентална клиника: Пълно ръководство за 2025", category: "AI & Иновации", tags: ["ръководство", "AI", "2025"] },
  { title: "Как да изградите доверие с нови пациенти преди първата визита", category: "Маркетинг", tags: ["доверие", "нови пациенти", "маркетинг"] },
  { title: "Топ 7 грешки, които денталните клиники правят с телефонните обаждания", category: "Бизнес съвети", tags: ["грешки", "телефон", "клиники"] },
  { title: "Сравнение: Жив рецепционист срещу AI рецепционист — реални числа", category: "Финанси", tags: ["сравнение", "разходи", "ROI"] },
  { title: "Как работи гласовият AI рецепционист? Обясняваме с прости думи", category: "AI & Иновации", tags: ["гласов AI", "обяснение", "технологии"] },
  { title: "5 начина да задържите пациент, който е мислил да смени клиниката", category: "Бизнес съвети", tags: ["задържане", "лоялност", "пациенти"] },
  { title: "Дентална клиника 2025: Как да победите конкуренцията с технологии", category: "Стратегия", tags: ["конкуренция", "технологии", "2025"] },
  { title: "Автоматизирано записване на часове: Ръководство стъпка по стъпка", category: "Технологии", tags: ["записване", "автоматизация", "ръководство"] },
  { title: "Защо пациентите не перезвъняват — и как да спрете да губите ги завинаги", category: "Психология на продажбите", tags: ["психология", "пациенти", "обаждания"] },
];

async function generateBlogPost(topic: typeof BLOG_TOPICS[0]): Promise<{ title: string; slug: string; excerpt: string; content: string; readTime: number }> {
  const prompt = `Напиши подробна, ангажираща статия в блог за тема: "${topic.title}"

Категория: ${topic.category}

ИЗИСКВАНИЯ:
- Език: Перфектен български, без чуждици освен технически термини
- Тон: Авторитетен, убедителен, но разговорен — като съветник, не като робот
- Дължина: 600-800 думи
- Структура: Въведение (hook) → 3-4 основни секции с подзаглавия → Заключение с CTA
- Използвай конкретни числа, примери и факти (може да са реалистични)
- Целева аудитория: Собственици на дентални клиники в България
- Продуктът DentAI трябва да е споменат естествено, не агресивно — 1-2 пъти максимум
- Подзаглавията форматирай с ##
- Не използвай bullet points прекалено много — предпочитай параграфи

Върни САМО съдържанието на статията, без заглавие в началото.`;

  const content = await groqChat({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 1500,
    temperature: 0.7,
  });

  // Generate excerpt
  const excerpt =
    (await groqChat({
      messages: [{ role: "user", content: `Напиши кратко резюме (2 изречения, до 160 символа) за тази статия:
${content.slice(0, 500)}` }],
      maxTokens: 100,
      temperature: 0.5,
    })) || topic.title;

  const slug = topic.title
    .toLowerCase()
    .replace(/[а-яА-ЯёЁ]/g, (c) => {
      const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sht",ъ:"a",ь:"",ю:"yu",я:"ya" };
      return map[c.toLowerCase()] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const wordCount = content.split(" ").length;
  const readTime = Math.max(3, Math.ceil(wordCount / 200));

  return { title: topic.title, slug, excerpt, content, readTime };
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow if no secret set (for testing)
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Check if today is a publish day
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, 3=Wed, 5=Fri
  if (!PUBLISH_DAYS.includes(dayOfWeek)) {
    return NextResponse.json({ skipped: true, reason: "Not a publish day", day: dayOfWeek });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pick a topic that hasn't been used recently
    const { data: recentSlugs } = await supabase
      .from("blog_posts")
      .select("slug")
      .order("created_at", { ascending: false })
      .limit(20);

    const usedTitles = new Set((recentSlugs || []).map((r: { slug: string }) => r.slug.slice(0, 20)));
    const availableTopics = BLOG_TOPICS.filter(t => {
      const slug = t.title.slice(0, 20).toLowerCase();
      return !usedTitles.has(slug);
    });

    const topic = availableTopics.length > 0
      ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
      : BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];

    // Generate the post
    const generated = await generateBlogPost(topic);

    // Save to DB as pending
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        slug: `${generated.slug}-${Date.now()}`,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        category: topic.category,
        tags: topic.tags,
        status: "pending",
        scheduled_for: today.toISOString().split("T")[0],
        read_time_minutes: generated.readTime,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Send approval email
    const approveUrl = `${APP_URL}/api/blog/approve?id=${post.id}&action=approve`;
    const rejectUrl = `${APP_URL}/api/blog/approve?id=${post.id}&action=reject`;

    await fetch(`${APP_URL}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "blog_review",
        postId: post.id,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        category: topic.category,
        approveUrl,
        rejectUrl,
      }),
    });

    return NextResponse.json({ success: true, postId: post.id, title: generated.title });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
