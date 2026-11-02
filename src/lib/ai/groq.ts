// Groq chat completions — общ helper за всички извиквания към Groq.
// Моделът се задава с GROQ_MODEL, за да може да се смени без промяна в кода,
// когато Groq спре даден модел (напр. llama-3.3-70b-versatile беше спрян на 16.08.2026).

export const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
// Резервен модел при rate limit (429) — има отделен лимит в Groq.
export const DEFAULT_GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export function getGroqFallbackModel(): string | null {
  const value = process.env.GROQ_FALLBACK_MODEL?.trim();
  if (value === "none") return null;
  return value || DEFAULT_GROQ_FALLBACK_MODEL;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChatOptions {
  messages: GroqMessage[];
  maxTokens: number;
  temperature: number;
}

export class GroqError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "GroqError";
  }
}

// gpt-oss е reasoning модел: изключваме reasoning от отговора (include_reasoning: false)
// и ограничаваме разсъжденията (reasoning_effort: "low"). Тези параметри се поддържат
// само от gpt-oss моделите в Groq, затова ги пращаме само на тях.
function isGptOss(model: string): boolean {
  return model.startsWith("openai/gpt-oss");
}

export async function groqChat(options: GroqChatOptions): Promise<string> {
  const primary = getGroqModel();
  try {
    return await groqChatWithModel(primary, options);
  } catch (error) {
    const fallback = getGroqFallbackModel();
    if (error instanceof GroqError && error.status === 429 && fallback && fallback !== primary) {
      console.warn(`[groq] rate limit on ${primary}, retrying with ${fallback}`);
      return groqChatWithModel(fallback, options);
    }
    throw error;
  }
}

async function groqChatWithModel(
  model: string,
  { messages, maxTokens, temperature }: GroqChatOptions
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqError(0, "GROQ_API_KEY is not set");

  const reasoning = isGptOss(model);

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      // При reasoning модели разсъжденията също харчат токени, затова оставяме запас.
      max_completion_tokens: reasoning ? maxTokens + 512 : maxTokens,
      temperature,
      ...(reasoning ? { include_reasoning: false, reasoning_effort: "low" } : {}),
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new GroqError(res.status, err.error?.message ?? `Groq HTTP ${res.status}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}
