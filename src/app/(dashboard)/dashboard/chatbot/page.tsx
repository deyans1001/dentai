"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clinic } from "@/types";
import ChatWidget from "@/components/chat/ChatWidget";
import { Plus } from "lucide-react";

const QUICK_PROMPTS = [
  { label: "📅 Часове днес", text: "Колко часа имам записани за днес?" },
  { label: "📊 Седмичен анализ", text: "Дай ми анализ за тази седмица — часове, натовареност" },
  { label: "📈 Месечна статистика", text: "Каква е месечната статистика на клиниката?" },
  { label: "👨‍⚕️ Най-зает лекар", text: "Кой лекар е най-зает тази седмица?" },
];

export default function ChatbotPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);

  useEffect(() => {
    const loadClinic = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("clinics")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) setClinic(data as Clinic);
    };
    loadClinic();
  }, []);

  function newConversation() {
    setSessionId(`session_${Date.now()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">AI Чатбот</h1>
          <p className="text-slate-400 text-sm mt-1">
            Анализирайте данните на клиниката с AI
          </p>
        </div>
        <button
          onClick={newConversation}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 border border-white/10 text-slate-300 text-sm transition-all"
        >
          <Plus size={15} />
          Нов разговор
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Quick prompts sidebar */}
        <div className="space-y-3">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Бързи запитвания</h3>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 rounded-xl bg-dark-800 border border-white/8 text-slate-300 text-sm hover:border-brand-blue/40 hover:text-white transition-all"
              onClick={() => {
                // This would need a ref to ChatWidget to inject the message
                // For now just show the text
              }}
            >
              {prompt.label}
            </button>
          ))}

          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <p className="text-blue-400 text-xs font-medium mb-2">Как да използвате:</p>
            <ul className="text-slate-400 text-xs space-y-1.5">
              <li>• Питайте за часове и статистики</li>
              <li>• Анализирайте натовареността</li>
              <li>• Сравнявайте периоди</li>
              <li>• Получавайте бизнес съвети</li>
            </ul>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-3">
          {clinic ? (
            <ChatWidget
              key={sessionId}
              clinicId={clinic.id}
              className="h-[500px] lg:h-[calc(100vh-260px)]"
            />
          ) : (
            <div className="h-[400px] bg-dark-800 border border-white/8 rounded-2xl flex items-center justify-center">
              <p className="text-slate-500">Зареждане...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
