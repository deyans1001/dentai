// Записване на час от чатбота (демо клиника „Дентал Смайл“) в Google Calendar
// през същия Make webhook, който ползва гласовият агент Ива (tool book_appointment).
// Формат на заявката — ТОЧНО като tool-а на Ива:
//   { patient_name, service, phone, start_time: "YYYY-MM-DDTHH:MM", end_time: "YYYY-MM-DDTHH:MM" }
// Часовете са местно време Europe/Sofia, продължителност 30 минути.

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { GroqTool } from "@/lib/ai/groq";

export const CLINIC_TIME_ZONE = "Europe/Sofia";
export const APPOINTMENT_MINUTES = 30;
export const MAX_BOOKINGS_PER_IP_PER_DAY = 3;
const MAX_DAYS_AHEAD = 60;

// Работно време на демо клиниката (същото като в демо промпта и гласовия агент).
// 0 = неделя ... 6 = събота
const WORKING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: null,
  1: { open: "09:00", close: "19:00" },
  2: { open: "09:00", close: "19:00" },
  3: { open: "09:00", close: "19:00" },
  4: { open: "09:00", close: "19:00" },
  5: { open: "09:00", close: "19:00" },
  6: { open: "09:00", close: "14:00" },
};

const WEEKDAYS = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
const MONTHS = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];

export interface BookingDetails {
  patient_name: string;
  service: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

// ---------- Дата и час в София ----------

interface SofiaNow {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export function sofiaNow(now: Date = new Date()): SofiaNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function parseDate(date: string): { y: number; m: number; d: number; weekday: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return null;
  return { y, m, d, weekday: utc.getUTCDay() };
}

function addDays(date: string, days: number): string {
  const p = parseDate(date)!;
  return new Date(Date.UTC(p.y, p.m - 1, p.d + days)).toISOString().slice(0, 10);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function formatDateBg(date: string): string {
  const p = parseDate(date);
  if (!p) return date;
  return `${WEEKDAYS[p.weekday]}, ${p.d} ${MONTHS[p.m - 1]} ${p.y} г.`;
}

/** Най-ранният възможен час: следващият кръгъл половин час след поне 30 мин., в работно време. */
export function earliestSlot(now: Date = new Date()): { date: string; time: string } | null {
  const today = sofiaNow(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today.date, i);
    const hours = WORKING_HOURS[parseDate(day)!.weekday];
    if (!hours) continue;
    let start = toMinutes(hours.open);
    if (i === 0) start = Math.max(start, Math.ceil((toMinutes(today.time) + 30) / 30) * 30);
    if (start + APPOINTMENT_MINUTES <= toMinutes(hours.close)) return { date: day, time: fromMinutes(start) };
  }
  return null;
}

/** Текст за системния промпт: днешната дата/час и календар за следващите 14 дни. */
export function buildCalendarPrompt(now: Date = new Date()): string {
  const { date, time } = sofiaNow(now);
  const lines: string[] = [];
  for (let i = 0; i < 14; i++) {
    const day = addDays(date, i);
    const label = i === 0 ? "днес" : i === 1 ? "утре" : i === 2 ? "вдругиден" : "";
    const hours = WORKING_HOURS[parseDate(day)!.weekday];
    lines.push(
      `- ${label ? label + " = " : ""}${formatDateBg(day)} (${day})${hours ? `, работно време ${hours.open}–${hours.close}` : ", почивен ден"}`
    );
  }
  const first = earliestSlot(now);
  return `ДАТА И ЧАС (Europe/Sofia): сега е ${time}, ${formatDateBg(date)} (${date}).
${first ? `Най-ранният възможен час за записване е ${formatDateBg(first.date)} в ${first.time}. Минали дати и часове не могат да се записват.` : ""}
Използвай САМО този календар, когато пациентът каже „утре“, ден от седмицата или дата:
${lines.join("\n")}`;
}

// ---------- Валидация ----------

/** Нормализира български телефон до +359XXXXXXXX(X). Връща null, ако е невалиден. */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().\/]/g, "");
  const match = /^(?:\+359|00359|0)(\d{8,9})$/.exec(cleaned);
  if (!match) return null;
  const rest = match[1];
  // Мобилни: 87/88/89/98 + 7 цифри; стационарни: 8 или 9 цифри без водеща нула.
  if (rest.startsWith("0")) return null;
  if (/^(87|88|89|98)/.test(rest) && rest.length !== 9) return null;
  return `+359${rest}`;
}

export function validateBooking(input: BookingDetails, now: Date = new Date()): { ok: true; value: BookingDetails } | { ok: false; error: string } {
  const patient_name = input.patient_name.trim().replace(/\s+/g, " ");
  const service = input.service.trim().replace(/\s+/g, " ");

  if (patient_name.length < 3 || patient_name.length > 100 || patient_name.split(" ").length < 2 || /\d/.test(patient_name)) {
    return { ok: false, error: "Моля, напишете име и фамилия на пациента." };
  }
  if (service.length < 2 || service.length > 100) {
    return { ok: false, error: "Моля, уточнете за каква услуга е часът." };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Телефонният номер не изглежда валиден. Моля, напишете го отново, например 0888 123 456." };
  }

  const p = parseDate(input.date);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(input.time);
  if (!p || !timeMatch) {
    return { ok: false, error: "Не разбрах датата или часа. Моля, кажете ги отново, например „утре в 11:00“." };
  }

  const today = sofiaNow(now);
  if (`${input.date}T${input.time}` <= `${today.date}T${today.time}`) {
    return { ok: false, error: "Този час вече е минал. Моля, изберете бъдещ ден и час." };
  }
  if (input.date > addDays(today.date, MAX_DAYS_AHEAD)) {
    return { ok: false, error: `Можем да запишем час до ${MAX_DAYS_AHEAD} дни напред. Моля, изберете по-близка дата.` };
  }

  const hours = WORKING_HOURS[p.weekday];
  if (!hours) {
    return { ok: false, error: `В ${WEEKDAYS[p.weekday]} клиниката не работи. Моля, изберете ден от понеделник до събота.` };
  }
  const start = toMinutes(input.time);
  if (start < toMinutes(hours.open) || start + APPOINTMENT_MINUTES > toMinutes(hours.close)) {
    return {
      ok: false,
      error: `В ${WEEKDAYS[p.weekday]} работим от ${hours.open} до ${hours.close}. Моля, изберете час между ${hours.open} и ${fromMinutes(toMinutes(hours.close) - APPOINTMENT_MINUTES)}.`,
    };
  }

  return { ok: true, value: { patient_name, service, phone, date: input.date, time: input.time } };
}

// ---------- Обобщение за потвърждение ----------
// Обобщението се генерира от сървъра (не от модела) и после се разчита обратно,
// когато пациентът отговори „Да“. Така се записва точно това, което пациентът е видял.

const SUMMARY_HEADER = "Моля, проверете данните за записване:";
const SUMMARY_FOOTER = "Ако всичко е вярно, напишете „Да“ и ще запиша часа.";

export function buildSummary(b: BookingDetails): string {
  return [
    SUMMARY_HEADER,
    `Име: ${b.patient_name}`,
    `Услуга: ${b.service}`,
    `Телефон: ${b.phone}`,
    `Дата и час: ${formatDateBg(b.date)}, ${b.time} ч.`,
    SUMMARY_FOOTER,
  ].join("\n");
}

export function parseSummary(text: string | undefined): BookingDetails | null {
  if (!text || !text.startsWith(SUMMARY_HEADER)) return null;
  const field = (name: string) => new RegExp(`^${name}: (.+)$`, "m").exec(text)?.[1]?.trim();
  const patient_name = field("Име");
  const service = field("Услуга");
  const phone = field("Телефон");
  const when = /^Дата и час: [^,]+, (\d{1,2}) ([а-я]+) (\d{4}) г\., (\d{2}:\d{2}) ч\.$/m.exec(text);
  if (!patient_name || !service || !phone || !when) return null;
  const month = MONTHS.indexOf(when[2]) + 1;
  if (month === 0) return null;
  const date = `${when[3]}-${String(month).padStart(2, "0")}-${when[1].padStart(2, "0")}`;
  return { patient_name, service, phone, date, time: when[4] };
}

/** Строго „Да“ — само кратки, недвусмислени потвърждения. „Да, но…“ НЕ е потвърждение. */
export function isExplicitYes(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[!.,„“"'👍✅🙂😊]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [
    "да",
    "да моля",
    "да потвърждавам",
    "потвърждавам",
    "да запиши",
    "да записвай",
    "да запишете",
    "да благодаря",
    "да точно така",
    "да всичко е вярно",
    "да вярно е",
  ].includes(normalized);
}

// ---------- Tool за модела ----------

export const PROPOSE_BOOKING_TOOL: GroqTool = {
  type: "function",
  function: {
    name: "propose_booking",
    description:
      "Извикай САМО когато пациентът вече е казал и петте данни: име и фамилия, услуга, телефон, дата и час. " +
      "Сървърът проверява данните и показва на пациента обобщение за потвърждение. Този инструмент НЕ записва часа.",
    parameters: {
      type: "object",
      properties: {
        patient_name: { type: "string", description: "Име и фамилия на пациента" },
        service: { type: "string", description: "Услугата, напр. преглед, почистване, пломба" },
        phone: { type: "string", description: "Телефон на пациента, както го е написал" },
        date: { type: "string", description: "Дата във формат YYYY-MM-DD според календара в системния промпт" },
        time: { type: "string", description: "Час във формат HH:MM (24-часов)" },
      },
      required: ["patient_name", "service", "phone", "date", "time"],
    },
  },
};

export function parseToolArgs(raw: string): BookingDetails | null {
  try {
    const a = JSON.parse(raw) as Partial<Record<keyof BookingDetails, unknown>>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      patient_name: str(a.patient_name),
      service: str(a.service),
      phone: str(a.phone),
      date: str(a.date),
      time: str(a.time),
    };
  } catch {
    return null;
  }
}

// ---------- Ограничение: 3 записвания на ден от един IP ----------
// Пазим само хеш на IP адреса (не самия адрес) в таблица chat_bookings.
// Ако таблицата още не е създадена, ползваме временно ограничение в паметта.

const memoryLimiter = new Map<string, number[]>();

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${process.env.INTERNAL_API_SECRET ?? "dentai"}:${ip}`).digest("hex");
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "PGRST205" || error.code === "42P01");
}

export async function countRecentBookings(ipHash: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const db = supabaseAdmin();
  if (db) {
    // Без head: true — при HEAD заявка грешката „няма таблица“ идва без тяло и count е null.
    const { count, error } = await db
      .from("chat_bookings")
      .select("id", { count: "exact" })
      .eq("ip_hash", ipHash)
      .gte("created_at", since.toISOString())
      .limit(1);
    if (!error && typeof count === "number") return count;
    if (error && !isMissingTable(error)) throw new Error(`chat_bookings count failed: ${error.message}`);
    console.warn("[chat-booking] table chat_bookings missing — using in-memory rate limit");
  }
  return (memoryLimiter.get(ipHash) ?? []).filter((t) => t > since.getTime()).length;
}

export async function recordBooking(ipHash: string, startTime: string): Promise<void> {
  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("chat_bookings").insert({ ip_hash: ipHash, start_time: startTime });
    if (!error) return;
    if (!isMissingTable(error)) console.error("[chat-booking] record failed:", error.message);
  }
  memoryLimiter.set(ipHash, [...(memoryLimiter.get(ipHash) ?? []), Date.now()]);
}

// ---------- Изпращане към Make ----------

export interface MakeResult {
  ok: boolean;
  status: number;
  body: string;
}

export function toMakePayload(b: BookingDetails) {
  return {
    patient_name: b.patient_name,
    service: b.service,
    phone: b.phone,
    start_time: `${b.date}T${b.time}`,
    end_time: `${b.date}T${fromMinutes(toMinutes(b.time) + APPOINTMENT_MINUTES)}`,
  };
}

export async function sendToMake(b: BookingDetails): Promise<MakeResult> {
  const url = process.env.MAKE_BOOKING_WEBHOOK_URL;
  if (!url) return { ok: false, status: 0, body: "MAKE_BOOKING_WEBHOOK_URL is not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toMakePayload(b)),
      signal: AbortSignal.timeout(20000), // същият timeout като tool-а на Ива
    });
    const body = (await res.text()).slice(0, 500);
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: error instanceof Error ? error.message : "network error" };
  }
}
