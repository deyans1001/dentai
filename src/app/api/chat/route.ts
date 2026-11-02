import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqChatWithTools, getGroqModel } from "@/lib/ai/groq";
import {
  PROPOSE_BOOKING_TOOL,
  buildCalendarPrompt,
  buildSummary,
  countRecentBookings,
  formatDateBg,
  hashIp,
  isExplicitYes,
  parseSummary,
  parseToolArgs,
  recordBooking,
  sendToMake,
  validateBooking,
  MAX_BOOKINGS_PER_IP_PER_DAY,
  type BookingDetails,
} from "@/lib/booking/chat-booking";
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
При записване питай едно по едно: услуга, ден и час, име и фамилия, телефон. Това е демо версия и часът НЕ се записва реално: когато събереш данните, обобщи ги и кажи, че в реалната версия часът ще бъде записан директно в календара на клиниката. Никога не казвай, че часът е записан.
Не давай медицински диагнози.

${STYLE_RULES}`;
}

// Модел, който „твърди“ записване без реално изпращане — заменяме отговора.
const FALSE_BOOKING_CLAIM = /(записах|записахме|успешно записан|часът (ви |ти )?е записан|записан(а|и)? сте)/i;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function completeBooking(req: NextRequest, details: BookingDetails): Promise<string> {
  const check = validateBooking(details);
  if (!check.ok) return check.error;
  const booking = check.value;

  const ipHash = hashIp(getClientIp(req));
  if ((await countRecentBookings(ipHash)) >= MAX_BOOKINGS_PER_IP_PER_DAY) {
    return `От тази връзка вече са направени ${MAX_BOOKINGS_PER_IP_PER_DAY} записвания за последните 24 часа. Часът НЕ е записан. Моля, опитайте отново утре.`;
  }

  const result = await sendToMake(booking);
  console.log("[chat-booking] make status=%d ok=%s body=%s", result.status, result.ok, result.body.slice(0, 200));
  if (!result.ok) {
    return "Съжалявам, записването не успя и часът НЕ е записан. Моля, опитайте отново след малко.";
  }

  await recordBooking(ipHash, `${booking.date}T${booking.time}`);
  return `Готово! Записах Ви за ${formatDateBg(booking.date)} в ${booking.time} ч. — ${booking.service}. Часът е в календара на клиниката.`;
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

    // Реално записване има само в основното демо („Дентал Смайл“) — не за чужди клиники.
    const bookingEnabled = !clinicData && !clinicContext;

    // Пациентът отговаря „Да“ на обобщението, генерирано от сървъра → записваме директно,
    // без модела, с точно данните от обобщението.
    if (bookingEnabled && apiMessages.length >= 2) {
      const last = apiMessages[apiMessages.length - 1];
      const previous = apiMessages[apiMessages.length - 2];
      const pending = previous.role === "assistant" ? parseSummary(previous.content) : null;
      if (pending && last.role === "user" && isExplicitYes(last.content)) {
        return NextResponse.json({ reply: await completeBooking(req, pending) });
      }
    }

    const userTurns = apiMessages.filter((m) => m.role === "user").length;
    const conversationStarted = firstUserIndex > 0 || userTurns > 1;

    const continuationInstruction = conversationStarted
      ? `ВАЖНО: Разговорът е в ход. НЕ поздравявай. Отговори директно на последното съобщение.`
      : ``;

    const systemPrompt = [
      clinicData || !clinicContext ? buildSystemPrompt(clinicData) : buildContextPrompt(clinicContext),
      bookingEnabled ? buildCalendarPrompt() : getBgTime(),
      continuationInstruction,
    ]
      .filter(Boolean)
      .join("\n\n");

    const modelReply = await groqChatWithTools({
      messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
      maxTokens: 300,
      temperature: 0.3,
      tools: bookingEnabled ? [PROPOSE_BOOKING_TOOL] : undefined,
    });

    // Моделът е събрал данните → сървърът ги проверява и показва обобщение за „Да“.
    const toolCall = modelReply.toolCalls.find((c) => c.function.name === PROPOSE_BOOKING_TOOL.function.name);
    if (bookingEnabled && toolCall) {
      const args = parseToolArgs(toolCall.function.arguments);
      const check = args ? validateBooking(args) : null;
      if (!check) {
        return NextResponse.json({ reply: "Моля, кажете ми отново името, услугата, телефона, датата и часа." });
      }
      return NextResponse.json({ reply: check.ok ? buildSummary(check.value) : check.error });
    }

    let reply = cleanReply(modelReply.content);

    if (reply && FALSE_BOOKING_CLAIM.test(reply)) {
      console.warn("[api/chat] replaced false booking claim:", reply.slice(0, 120));
      reply = bookingEnabled
        ? "За да запиша часа, ми трябват име и фамилия, услуга, телефон, дата и час. Кое от тях да уточним?"
        : "Това е демо версия, затова часът не се записва реално. В реалната версия ще бъде записан директно в календара на клиниката.";
    }

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
