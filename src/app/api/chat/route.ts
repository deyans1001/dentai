import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqChat, getGroqModel } from "@/lib/ai/groq";
import { getDemoChatPrompt } from "@/lib/ai/system-prompts";

const MAX_CONTEXT_CHARS = 500;
const MAX_HISTORY_MESSAGES = 20;

const STYLE_RULES = `СТИЛ:
- Отговаряй само на български, като истинска българка — топло, директно, естествено.
- Отговорите ти са 1-3 кратки изречения.
- Пиши само обикновен текст: без markdown, без звездички, без списъци, без таблици.
- Не показвай разсъжденията си — давай директно крайния отговор.
- Всички цени са в евро (€).`;

function cleanReply(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function extractClinicName(context: string | null): string | null {
  const match = context?.match(/^Клиника:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function buildContextPrompt(context: string): string {
  return `Ти си Ива, AI рецепционист на дентална клиника. Собственикът на клиниката тества демо версия с тези данни:

${context}

Използвай тези данни. За неща, които не са посочени (цени, имена на лекари, адрес), кажи учтиво, че ще ги уточниш с клиниката или при преглед, и предложи да запишеш час. Не измисляй конкретни цени.
При записване питай едно по едно: услуга, ден и час, три имена, телефон. После потвърди записа.
Не давай медицински диагнози.

${STYLE_RULES}`;
}

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
    return `Ти си Ива, рецепционистът на клиниката.

${getDemoChatPrompt()}

${STYLE_RULES}`;
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

Не давай медицински диагнози или съвети. При спешност → дай телефона на клиниката.

${STYLE_RULES}`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message, clinicId, clinicContext: rawContext } = await req.json();
    const clinicContext =
      typeof rawContext === "string" && rawContext.trim()
        ? rawContext.trim().slice(0, MAX_CONTEXT_CHARS)
        : null;

    const history: { role: "user" | "assistant"; content: string }[] | null =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : message
        ? [{ role: "user", content: message }]
        : null;

    if (!history) return NextResponse.json({ reply: "Моля, напишете съобщение." });

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
    const apiMessages = history
      .slice(firstUserIndex)
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (apiMessages.length === 0) return NextResponse.json({ reply: "Моля, напишете съобщение." });

    const isGreetingRequest =
      apiMessages.length === 1 && apiMessages[0].content === "__greeting__";

    // Приветствието е фиксиран текст — връщаме го директно, без извикване на модела.
    if (isGreetingRequest) {
      const clinicName =
        clinicData?.name || extractClinicName(clinicContext) || (clinicContext ? "клиниката" : "Дентал Смайл");
      return NextResponse.json({
        reply: `${getGreetingWord()}, аз съм Ива, рецепционист на ${clinicName}. С какво мога да помогна?`,
      });
    }

    const userTurns = apiMessages.filter((m) => m.role === "user").length;
    const conversationStarted = firstUserIndex > 0 || userTurns > 1;

    const continuationInstruction = conversationStarted
      ? `ВАЖНО: Разговорът е в ход. НЕ поздравявай. Отговори директно на последното съобщение.`
      : ``;

    const systemPrompt = [
      clinicData || !clinicContext ? buildSystemPrompt(clinicData) : buildContextPrompt(clinicContext),
      getBgTime(),
      continuationInstruction,
    ]
      .filter(Boolean)
      .join("\n\n");

    let reply = cleanReply(
      await groqChat({
        messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
        maxTokens: 300,
        temperature: 0.3,
      })
    );

    if (conversationStarted && reply) {
      reply = stripGreeting(reply);
    }

    if (!reply) {
      return NextResponse.json({ reply: "Не успях да обработя заявката. Опитайте отново." });
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    // Техническите детайли отиват само в сървърния лог, не към потребителя.
    console.error("[api/chat] model=%s", getGroqModel(), error);
    return NextResponse.json({
      reply: "Съжалявам, в момента не мога да отговоря. Моля, опитайте отново след малко.",
    });
  }
}
