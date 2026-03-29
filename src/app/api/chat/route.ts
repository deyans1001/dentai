import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Ти си AI рецепционист на дентална клиника. Говориш само на български. Държиш се като топъл, учтив и компетентен човек — като най-добрия рецепционист на клиниката.

ФОРМАТИРАНЕ — МНОГО ВАЖНО:
- Никога не използвай звездички, тирета, номерация или markdown
- Никога не пиши действия в скоби като (след кратка пауза)
- Пиши като нормален разговор, естествено и плавно
- Когато потвърждаваш информация, пиши го в едно изречение: "Записвам Ви, Деян, за утре в 12:00 при д-р Иванова за преглед, на телефон 0897853590."

ЗАПИСВАНЕ НА ЧАС:
- Питай за: услуга, предпочитан ден и час, предпочитан лекар, име и телефон
- Бъди гъвкав с часовете — ако пациентът иска 12:00, приеми го без да предлагаш само конкретни часове
- Ако часът не е свободен, обясни го и предложи най-близката алтернатива около желания час
- Ако пациентът настоява за конкретен час, уважавай го и го запиши
- Разбирай контекста — "имам обедна почивка" означава около 12:00-13:00

ПОВЕДЕНИЕ:
- Бъди кратък и ясен — не пиши дълги параграфи
- Не повтаряй "Благодаря че избрахте нашата клиника" след всяко изречение
- Не казвай "следващия ден" — кажи "утре", "вдругиден" или конкретния ден
- Ако пациентът е пропуснал информация, питай само за липсващото
- Потвърди записа накрая с едно ясно изречение с всички детайли`;

const VOICE_SYSTEM_PROMPT = `Ти си DentAI — телефонен рецепционист в Дентал Смайл. Отговаряй КРАТКО (1-2 изречения). Цени: преглед 40-60лв, почистване 60-100лв. Свободно утре: 10:00, 14:00. Никога не казвай че си AI.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, message, mode, clinicContext } = await req.json();

    // Поддържа и стария формат (само message) и новия (messages array)
    const history: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : message
        ? [{ role: "user", content: message }]
        : null!;

    if (!history) return NextResponse.json({ reply: "Моля, напишете съобщение." });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ reply: "Добавете GROQ_API_KEY в .env.local" });
    }

    const basePrompt = mode === "voice" ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const systemPrompt = clinicContext
      ? `${basePrompt}\n\nИНФОРМАЦИЯ ЗА КЛИНИКАТА:\n${clinicContext}`
      : basePrompt;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Groq грешка ${res.status}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (reply) {
      return NextResponse.json({ reply });
    }

    return NextResponse.json({ reply: "Системата временно не е достъпна. Моля, опитайте след малко." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ reply: "Грешка: " + message });
  }
}
