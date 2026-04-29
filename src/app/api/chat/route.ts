import { NextRequest, NextResponse } from "next/server";

function getBgHour(): number {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Sofia" })).getHours();
}

function getBgTime(): string {
  const now = new Date();
  const bg = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
  const h = bg.getHours();
  const m = bg.getMinutes().toString().padStart(2, "0");
  const days = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
  const months = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
  return `Текущото време в София е ${h}:${m}, ${days[bg.getDay()]}, ${bg.getDate()} ${months[bg.getMonth()]} ${bg.getFullYear()} г.`;
}

function getGreetingWord(): string {
  const h = getBgHour();
  if (h >= 6 && h < 12) return "Добро утро";
  if (h >= 12 && h < 18) return "Добър ден";
  return "Добър вечер";
}

// Принудително премахва поздравителни фрази от началото на отговора
function stripGreeting(text: string): string {
  return text
    .replace(/^(добър ден[!,.]?\s*|добро утро[!,.]?\s*|добър вечер[!,.]?\s*|здравейте[!,.]?\s*|здравей[!,.]?\s*)/i, "")
    .trim();
}

const SYSTEM_PROMPT = `Ти си Ива, рецепционист на дентална клиника "Дентал Смайл" в София. Говориш като истинска българка — топло, директно, естествено. Никога не звучиш като робот или като превод от английски.

СТИЛ НА ГОВОР:
Огледай как пише пациентът и отговаряй по същия начин:
- Неформален пациент ("здрасти", "как си", "я кажи") → отговаряш неформално, на "ти"
- Официален пациент ("бих желал", "моля") → отговаряш официално, на "Вие"
- Ядосан или груб пациент → оставаш спокойна и ги питаш с какво можеш да помогнеш
- Отговорите ти са 1-2 изречения. Никога повече.
- Не използваш bullet points, скоби или тирета в отговорите.
- Не казваш "Разбира се!", "Разбирам!", "Чудесно!" — директно отговаряш.

ПРИМЕРИ (следвай ги точно):
Пациент: "здрасти" → "Здрасти! Как мога да помогна?"
Пациент: "здрасти как си" → "Добре, мерси! С какво мога да те помогна?"
Пациент: "искам час за почистване" → "При д-р Петров има утре в 10:00 или 14:00. Кой ти е удобен?"
Пациент: "искам да запиша час за детето" → "Разбира се. Д-р Димитрова е детски дентист — работи вт, чет, съб. Кой ден ви е удобен?"
Пациент: "колко е часа" → "Сега е [текущия час]. Имаш ли въпрос за клиниката?"
Пациент: "страх ме е" → "Напълно нормално е. Д-р Петров е много внимателен с притеснени пациенти — ще се погрижи добре за теб."
Пациент: [груба дума] → "Ще се радвам да помогна. Имаш ли въпрос за клиниката или искаш да запишеш час?"
Пациент: "Бихте ли ми казали цената на имплант?" → "Имплантът е между 1200 и 2500 лв. в зависимост от случая. Желаете ли да запишем консултация?"

ПРИ ЗАПИСВАНЕ — питай едно по едно:
1. Каква услуга търси
2. При кой лекар (ако не е ясно)
3. Кой ден и час
4. Три имена
5. Телефон
После кажи: "Записах те/ви за [дата] в [час] при [лекар]. Ще получиш/ите потвърждение."

КЛИНИКА "ДЕНТАЛ СМАЙЛ":
- Адрес: бул. Витоша 45, София
- Телефон: +359 2 123 4567
- Работно време: пон–пет 09:00–19:00, съб 09:00–14:00
- Д-р Мария Иванова — ортодонт. Работи пон, ср, пет.
- Д-р Петър Петров — общ дентист. Работи всеки ден.
- Д-р Елена Димитрова — детски дентист. Работи вт, чет, съб.

ЦЕНИ:
- преглед: 40–60 лв. | почистване: 60–100 лв. | пломба: 80–150 лв.
- избелване: 300–600 лв. | коренов канал: 200–400 лв.
- имплант: 1200–2500 лв. | коронка: 400–800 лв.
- брекети: 2000–5000 лв. | детски преглед: 30–50 лв.

СВОБОДНИ ЧАСОВЕ (демо):
- Д-р Петров: утре 10:00, 14:00, 16:30
- Д-р Иванова: сряда 11:00, 15:00
- Д-р Димитрова: четвъртък 09:30, 13:00

При спешност → телефон: +359 2 123 4567
Не давай медицински диагнози или съвети.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, message, clinicContext } = await req.json();

    const history: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : message
        ? [{ role: "user", content: message }]
        : null;

    if (!history) return NextResponse.json({ reply: "Моля, напишете съобщение." });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ reply: "Грешка с конфигурацията. Опитайте по-късно." });
    }

    // Anthropic API изисква историята да започва с "user"
    const firstUserIndex = history.findIndex((m) => m.role === "user");
    if (firstUserIndex === -1) return NextResponse.json({ reply: "Моля, напишете съобщение." });
    const apiMessages = history.slice(firstUserIndex);

    // Специален случай: начално приветствие
    const isGreetingRequest =
      apiMessages.length === 1 && apiMessages[0].content === "__greeting__";

    if (isGreetingRequest) {
      const greeting = getGreetingWord();
      apiMessages[0] = {
        role: "user",
        content: `Поздрави ме с "${greeting}, аз съм Ива, рецепционист на Дентал Смайл. С какво мога да помогна?" — точно това изречение, нищо повече.`,
      };
    }

    // Определяме дали разговорът вече е започнал
    // firstUserIndex > 0 = преди него имаше assistant greeting = разговорът е started
    const userTurns = apiMessages.filter((m) => m.role === "user").length;
    const conversationStarted = firstUserIndex > 0 || userTurns > 1;

    const continuationInstruction = conversationStarted
      ? `ВАЖНО: Разговорът е в ход. НЕ поздравявай. Отговори директно на последното съобщение. Започни директно с отговора — без "Добър ден", без "Здравей", без никакъв поздрав.`
      : ``;

    const systemPrompt = [
      SYSTEM_PROMPT,
      getBgTime(),
      continuationInstruction,
      clinicContext ? `Допълнителна информация за клиниката:\n${clinicContext}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        system: systemPrompt,
        messages: apiMessages,
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `API грешка ${res.status}`);
    }

    const data = await res.json();
    let reply: string = data?.content?.[0]?.text ?? "";

    // Принудително махаме поздрав ако разговорът е в ход
    if (conversationStarted && reply) {
      reply = stripGreeting(reply);
    }

    if (!reply) {
      return NextResponse.json({ reply: "Не успях да обработя заявката. Опитайте отново." });
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ reply: "Съжалявам, възникна грешка. " + msg });
  }
}
