import { NextRequest, NextResponse } from "next/server";

function getBulgarianGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return "Добро утро";
  if (hour >= 12 && hour < 18) return "Добър ден";
  return "Добър вечер";
}

function getTimeContext(): string {
  const now = new Date();
  const bgTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
  const hour = bgTime.getHours();
  const minutes = bgTime.getMinutes().toString().padStart(2, "0");
  const days = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
  const months = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
  const dayOfWeek = days[bgTime.getDay()];
  const day = bgTime.getDate();
  const month = months[bgTime.getMonth()];
  const year = bgTime.getFullYear();
  const greeting = getBulgarianGreeting(hour);

  return `Сега е ${hour}:${minutes}, ${dayOfWeek}, ${day} ${month} ${year} г. Подходящият поздрав е "${greeting}".`;
}

const SYSTEM_PROMPT = `Ти си Ива — AI рецепционист на зъболекарска клиника "Дентал Смайл" в София.

ЕЗИК И СТИЛ:
- Пишеш САМО на български.
- Пишеш разговорно, естествено, сякаш говориш на жив човек на рецепцията.
- Пишеш с малки букви освен в началото на изречение и при собствени имена. Никога не пишеш цели думи с главни букви.
- Отговорите ти са кратки — 1 до 3 изречения. Не повече.

ПОЗДРАВ:
- Поздравявай САМО в първото си съобщение, когато пациентът пише за първи път.
- След това НИКОГА не повтаряй поздрава. Просто отговаряй директно на въпроса.
- Пример за първо съобщение: "Добър вечер! Как мога да ви помогна?"
- Пример за второ и всяко следващо: "Да, имаме свободен час утре в 10:00 при д-р Петров."

ГРАМАТИКА — СПАЗВАЙ СТРИКТНО:
- "да обсъдим", "да направим", "да запишем" (НЕ "обсъдем", "направем")
- "часа" без ударение на последната гласна, просто "в десет часа"
- Никога не повтаряй една дума два пъти ("часа часа", "ден ден" са ЗАБРАНЕНИ)
- "преглед" (не "прегледа" когато не е членувано)
- "ви" с малка буква в средата на изречение
- "лв." след цената: "60 лв.", "200 лв."
- Не слагай главни букви на думи като "преглед", "почистване", "пломба" — те не са собствени имена

ПРИМЕРИ ЗА ПРАВИЛНИ ОТГОВОРИ:
- "Имаме свободен час утре в 14:00 при д-р Петров. Искате ли да ви запиша?"
- "Почистването на зъбен камък е между 60 и 100 лв. Желаете ли да запишете час?"
- "Д-р Иванова работи в понеделник, сряда и петък. Кой ден ви е удобен?"
- "Разбирам, че ви е неприятно. Ще се погрижим за вас. Д-р Петров е много внимателен."

ПРИМЕРИ ЗА ГРЕШНИ ОТГОВОРИ (НИКОГА НЕ ПИШИ ТАКА):
- "Добър вечер! Благодаря за въпроса. Добър вечер! Ще ви помогна." (повторен поздрав)
- "Преглед струва 40-60 Лева" (главна буква на "Лева")
- "Можем да обсъдем вашите нужди" (грешна форма — правилно е "обсъдим")
- "В Дванадесет Часа Часа" (главни букви + повторение)

КЛИНИКА "ДЕНТАЛ СМАЙЛ":
- Адрес: бул. Витоша 45, София
- Телефон: +359 2 123 4567
- Работно време: понеделник до петък 09:00-19:00, събота 09:00-14:00

Лекари:
- Д-р Мария Иванова, ортодонт (брекети, алайнери). Работи пон, ср, пет.
- Д-р Петър Петров, общ дентист (пломби, почистване, импланти). Работи всеки ден.
- Д-р Елена Димитрова, детски дентист. Работи вт, чет, съб.

Цени:
- профилактичен преглед: 40-60 лв.
- почистване на зъбен камък: 60-100 лв.
- пломба: 80-150 лв.
- избелване: 300-600 лв.
- коренов канал: 200-400 лв.
- имплант: 1200-2500 лв.
- коронка: 400-800 лв.
- ортодонтия (брекети): 2000-5000 лв.
- детски преглед: 30-50 лв.

Свободни часове (демо):
- д-р Петров: утре 10:00, 14:00, 16:30
- д-р Иванова: сряда 11:00, 15:00
- д-р Димитрова: четвъртък 09:30, 13:00

При записване питай последователно: каква услуга, при кой лекар, кога е удобно, три имена, телефон за връзка.
При записан час: "Записах ви на [дата] в [час] при [лекар]. Ще получите потвърждение на телефона."
При спешност: насочи към телефон +359 2 123 4567.
Не давай медицински съвети. Бъди топъл с тревожни пациенти.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, message, mode, clinicContext } = await req.json();

    const history: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : message
        ? [{ role: "user", content: message }]
        : null;

    if (!history) return NextResponse.json({ reply: "Моля, напишете съобщение." });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ reply: "Грешка с конфигурацията. Опитайте по-късно." });
    }

    const timeContext = getTimeContext();
    const isFirstMessage = history.length === 1;
    const greetingInstruction = isFirstMessage
      ? "Това е първото съобщение на пациента. Започни с кратък поздрав и попитай с какво можеш да помогнеш."
      : "Това НЕ е първото съобщение. НЕ поздравявай. Отговори директно на въпроса.";

    const systemPrompt = `${SYSTEM_PROMPT}\n\n${timeContext}\n${greetingInstruction}${clinicContext ? `\n\nДопълнителен контекст:\n${clinicContext}` : ""}`;

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
        max_tokens: 200,
        temperature: 0.3,
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

    return NextResponse.json({ reply: "Не успях да обработя заявката. Опитайте отново." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ reply: "Съжалявам, възникна грешка. " + message });
  }
}
