"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  clinicId?: string;
  className?: string;
  clinicContext?: string;
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function ChatWidget({ clinicId, className, clinicContext }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greetingFetched = useRef(false);

  // Зарежда приветствие от AI при първо отваряне
  useEffect(() => {
    if (greetingFetched.current) return;
    greetingFetched.current = true;

    setIsLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "__greeting__" }],
        clinicId,
        sessionId,
        clinicContext,
      }),
    })
      .then((r) => r.json())
      .then((data: { reply?: string }) => {
        setMessages([{ role: "assistant", content: data.reply || "Здравейте! Как мога да ви помогна?" }]);
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: "Здравейте! Как мога да ви помогна?" }]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Scroll само в контейнера на чата
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setIsLoading(true);

    try {
      const history = [...messages, { role: "user" as const, content: trimmed }];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          clinicId,
          sessionId,
          clinicContext,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { reply?: string };
      if (!data.reply) throw new Error("Empty reply");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply as string }]);
    } catch (err) {
      console.error("[ChatWidget]", err);
      setError("Няма връзка с асистента. Моля, опитайте отново.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-dark-800 border border-white/8 rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-700 border-b border-white/8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-lg">
          🦷
        </div>
        <div>
          <p className="text-sm font-semibold text-white">DentAI Асистент</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs text-slate-400">Онлайн</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ overscrollBehavior: "contain", minHeight: "200px" }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-gradient-to-br from-brand-blue to-blue-700 text-white rounded-br-sm"
                  : "bg-dark-700 text-slate-200 rounded-bl-sm border border-white/5"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-dark-700 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-dark-700 border-t border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2 bg-dark-800 border border-white/10 rounded-xl px-3 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишете съобщение..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none min-w-0"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              input.trim() && !isLoading
                ? "bg-brand-blue hover:bg-blue-600 text-white"
                : "bg-dark-600 text-slate-600 cursor-not-allowed"
            )}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
