import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

function stripGreeting(text: string): string {
  return text
    .replace(/^(добър ден[!,.]?\s*|добро утро[!,.]?\s*|добър вечер[!,.]?\s*|здравейте[!,.]?\s*|здравей[!,.]?\s*)/i, "")
    .trim();
}

function buildSystemPrompt(clinic: {
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  working_hours?: Record<string, { open: string; close: string; isOpen: boolean }>;
  services?: string[];
  ai_greeting?: string;
} | null): string {
  if (!clinic) {
    return `Ти си Ива, рецепционист на дентална клиника. Говориш като истинска българка — топло, директно, естествено. Отговорите ти са 1-2 изречения. Помагаш на пациенти да записват часове и отговаряш на въпроси за клиниката.`;
  }

  const workingHoursText = clinic.working_hours
    ? Object.entries(clinic.working_hours)
        .filter(([, v]) => v.isOpen)
        .map(([day, v]) => {
          const labels: Record<string, string> = { monday: "пон", tuesday: "вт", wednesday: "ср", thursday: "чет", friday: "пет", saturday: "съб", sunday: "нед" };
          return `${labels[day] || day}: ${v.open}–${v.close}`;
        })
        .join(", ")
    : "пон–пет 09:00–18:00";

  const servicesText = clinic.services?.length ? clinic.services.join(", ") : "обща стоматология";

  return `Ти си Ива, рецепционист на дентална клиника "${clinic.name}" в ${clinic.city || "България"}. Говориш като истинска българка — топло, директно, естествено. Никога не звучиш като робот или като превод от английски.

СТИЛ НА ГОВОР:
Огледай как пише пациентът и отговаряй по същия начин:
- Неформален пациент ("здрасти", "как си", "я кажи") → отговаряш неформално, на "ти"
- Официален пациент ("бих желал", "моля") → отговаряш официално, на "Вие"
- Ядосан или груб пациент → оставаш спокойна и ги питаш с какво можеш да помогнеш
- Отговорите ти са 1-2 изречения. Никога повече.
- Не използваш bullet points, скоби или тирета в отговорите.
- Не казваш "Разбира се!", "Разбирам!", "Чудесно!" — директно отговаряш.

ПРИ ЗАПИСВАНЕ — питай едно по едно:
1. Каква услуга търси
2. При кой лекар (ако не е ясно)
3. Кой ден и час
4. Три имена
5. Телефон
После кажи: "Записах те/ви за [дата] в [час]. Ще получиш/ите потвърждение."

КЛИНИКА "${clinic.name}":
- Адрес: ${clinic.address || ""}${clinic.city ? `, ${clinic.city}` : ""}
- Телефон: ${clinic.phone || "не е посочен"}
- Работно време: ${workingHoursText}
- Услуги: ${servicesText}
${clinic.ai_greeting ? `\nПерсонализирано приветствие: ${clinic.ai_greeting}` : ""}

Не давай медицински диагнози или съвети. При спешност → дай телефона на клиниката.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message, clinicId } = await req.json();

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

    // Load real clinic data if clinicId is provided
    let clinicData = null;
    if (clinicId) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("clinics")
          .select("name, address, phone, city, working_hours, services, ai_greeting")
          .eq("id", clinicId)
          .single();
        clinicData = data;
      } catch {
        // Continue without clinic data
      }
    }

    const firstUserIndex = history.findIndex((m) => m.role === "user");
    if (firstUserIndex === -1) return NextResponse.json({ reply: "Моля, напишете съобщение." });
    const apiMessages = history.slice(firstUserIndex);

    const isGreetingRequest =
      apiMessages.length === 1 && apiMessages[0].content === "__greeting__";

    if (isGreetingRequest) {
      const greeting = getGreetingWord();
      const clinicName = clinicData?.name || "клиниката";
      apiMessages[0] = {
        role: "user",
        content: `Поздрави ме с "${greeting}, аз съм Ива, рецепционист на ${clinicName}. С какво мога да помогна?" — точно това изречение, нищо повече.`,
      };
    }

    const userTurns = apiMessages.filter((m) => m.role === "user").length;
    const conversationStarted = firstUserIndex > 0 || userTurns > 1;

    const continuationInstruction = conversationStarted
      ? `ВАЖНО: Разговорът е в ход. НЕ поздравявай. Отговори директно на последното съобщение.`
      : ``;

    const systemPrompt = [
      buildSystemPrompt(clinicData),
      getBgTime(),
      continuationInstruction,
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...apiMessages,
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } })?.error?.message ?? `API грешка ${res.status}`);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    let reply: string = data?.choices?.[0]?.message?.content ?? "";

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
