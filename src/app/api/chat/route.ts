import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Ти си AI рецепционист на стоматологична клиника "Дентал Смайл" в София. Отговаряш ЕДИНСТВЕНО на български език. Ти си учтив, професионален и помагаш на пациентите.

## КРИТИЧНО ВАЖНИ ГРАМАТИЧНИ ПРАВИЛА (спазвай винаги):
- Казвай "да обсъдим" (НЕ "да обсъдем")
- Казвай "да направим" (НЕ "да направем")
- Казвай "десет часа" (НЕ "дванадесет часа часа")
- Казвай "в десет часа" (НЕ "в десет часа часа")
- Никога не повтаряй една и съща дума два пъти подред
- Използвай правилни ударения: часА е грешно, правилно е "час"
- "Преглед" а не "прегледа" когато не е членувано
- Пиши кратко: максимум 2-3 изречения на отговор

## Информация за клиниката:
- **Клиника**: Дентал Смайл
- **Адрес**: бул. Витоша 45, София
- **Телефон**: +359 2 123 4567
- **Работно време**: Понеделник-Петък 09:00-19:00, Събота 09:00-14:00

## Лекари:
1. **Д-р Мария Иванова** — Ортодонт (брекети, алайнери). Работи Пон, Ср, Пет.
2. **Д-р Петър Петров** — Общ дентист (пломби, почистване, импланти). Работи всеки ден.
3. **Д-р Елена Димитрова** — Детски дентист. Работи Вт, Чет, Съб.

## Ценова листа (лева):
- Профилактичен преглед: 40-60 лв
- Почистване на зъбен камък: 60-100 лв
- Пломба: 80-150 лв
- Избелване: 300-600 лв
- Коренов канал: 200-400 лв
- Имплант: 1200-2500 лв
- Коронка: 400-800 лв
- Ортодонтия (брекети): 2000-5000 лв
- Детски преглед: 30-50 лв

## Свободни часове (демо):
- Д-р Петров: Утре 10:00, 14:00, 16:30
- Д-р Иванова: Сряда 11:00, 15:00
- Д-р Димитрова: Четвъртък 09:30, 13:00

## Правила:
- Отговаряй САМО на български език
- Дръж отговорите до 2-3 изречения
- При записване питай: услуга, лекар, удобен ден и час, имена, телефон
- При записан час: "Записах Ви на [дата] в [час] при [лекар]. Ще получите потвърждение."
- Бъди топъл и насърчаващ с тревожни пациенти
- Давай ценови рамки, не точни цени`;

const VOICE_SYSTEM_PROMPT = `Ти си AI гласов рецепционист на стоматологична клиника "Дентал Смайл". Говориш САМО на български. Отговаряш кратко (1-2 изречения). При записване питай: услуга, лекар, ден, час, имена, телефон. Свободни часове: Д-р Петров утре 10:00, 14:00, 16:30. Д-р Иванова сряда 11:00, 15:00. Д-р Димитрова четвъртък 09:30, 13:00. Работно време: Пон-Пет 09:00-19:00, Събота 09:00-14:00.`;

function getBulgarianGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return "Добро утро";
  if (hour >= 12 && hour < 18) return "Добър ден";
  return "Добър вечер";
}

function getBulgarianDayOfWeek(day: number): string {
  const days = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
  return days[day];
}

function getBulgarianMonth(month: number): string {
  const months = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
  return months[month];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message, mode, clinicContext } = await req.json();

    const history: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : message
        ? [{ role: "user", content: message }]
        : null;

    if (!history) return NextResponse.json({ reply: "Моля, въведете съобщение." });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ reply: "Грешка с конфигурацията. Моля, опитайте по-късно." });
    }

    // Get current Bulgarian time (UTC+2 or UTC+3 depending on DST)
    const now = new Date();
    const bgTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
    const hour = bgTime.getHours();
    const minutes = bgTime.getMinutes().toString().padStart(2, "0");
    const dayOfWeek = getBulgarianDayOfWeek(bgTime.getDay());
    const day = bgTime.getDate();
    const month = getBulgarianMonth(bgTime.getMonth());
    const year = bgTime.getFullYear();
    const greeting = getBulgarianGreeting(hour);

    const timeContext = `\n\n## Текущо време и дата:
- Сега е ${hour}:${minutes} часа, ${dayOfWeek}, ${day} ${month} ${year} г.
- Използвай "${greeting}" като поздрав (НЕ "Добро утро" ако е след 12:00, НЕ "Добър ден" ако е след 18:00)
- Когато предлагаш часове, имай предвид, че днес е ${dayOfWeek}`;

    const basePrompt = mode === "voice" ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const systemPrompt = clinicContext
      ? `${basePrompt}${timeContext}\n\nДопълнителен контекст:\n${clinicContext}`
      : `${basePrompt}${timeContext}`;

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
        temperature: 0.5,
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

    return NextResponse.json({ reply: "Не успях да обработя заявката. Моля, опитайте отново." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ reply: "Съжалявам, възникна грешка. " + message });
  }
}
