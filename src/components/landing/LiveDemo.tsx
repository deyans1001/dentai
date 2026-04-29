"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ChatWidget from "@/components/chat/ChatWidget";
import VoiceAgent from "@/components/landing/VoiceAgent";

const FEATURES = [
  "Разбира естествен български",
  "Записва часове автоматично",
  "Помни контекста на разговора",
  "Отговаря под 1 секунда",
];

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "";

interface DemoForm {
  clinicName: string;
  workingHours: string;
  mainService: string;
}

export default function LiveDemo() {
  const [demoForm, setDemoForm] = useState<DemoForm>({ clinicName: "", workingHours: "", mainService: "" });
  const [clinicContext, setClinicContext] = useState<string | null>(null);

  return (
    <section id="demo" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-brand-gold text-sm font-medium mb-4">
            ПРОБВАЙТЕ САМИ
          </span>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white">
            Пробвайте с данните на вашата клиника
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
            Попълнете информацията и вижте как DentAI ще говори с вашите пациенти
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Demo form + Chat widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {!clinicContext ? (
              <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-1">Вашата клиника</h3>
                <p className="text-slate-500 text-sm mb-5">Попълнете данните и генерирайте персонализиран демо бот</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Име на клиника</label>
                    <input
                      type="text"
                      placeholder="напр. Дентал Смайл"
                      value={demoForm.clinicName}
                      onChange={(e) => setDemoForm((f) => ({ ...f, clinicName: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-600 text-sm outline-none focus:border-brand-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Работно време</label>
                    <input
                      type="text"
                      placeholder="напр. Пон-Пет 8:00-19:00, Сб 9:00-13:00"
                      value={demoForm.workingHours}
                      onChange={(e) => setDemoForm((f) => ({ ...f, workingHours: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-600 text-sm outline-none focus:border-brand-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Главна услуга</label>
                    <input
                      type="text"
                      placeholder="напр. Ортодонтия и имплантология"
                      value={demoForm.mainService}
                      onChange={(e) => setDemoForm((f) => ({ ...f, mainService: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-600 text-sm outline-none focus:border-brand-blue transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const parts: string[] = [];
                      if (demoForm.clinicName) parts.push(`Клиника: ${demoForm.clinicName}`);
                      if (demoForm.workingHours) parts.push(`Работно време: ${demoForm.workingHours}`);
                      if (demoForm.mainService) parts.push(`Главна услуга: ${demoForm.mainService}`);
                      setClinicContext(parts.length > 0 ? parts.join("\n") : "Демо клиника");
                    }}
                    className="w-full py-3 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Генерирай моя демо бот
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-brand-green text-sm font-medium">
                    {demoForm.clinicName || "Вашата клиника"} — персонализиран бот активен
                  </span>
                </div>
                <button
                  onClick={() => {
                    setClinicContext(null);
                    setDemoForm({ clinicName: "", workingHours: "", mainService: "" });
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Промени
                </button>
              </div>
            )}
            <ChatWidget className="h-[500px]" clinicContext={clinicContext ?? undefined} />
          </motion.div>

          {/* Right: ElevenLabs Voice Agent */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {AGENT_ID ? (
              <VoiceAgent agentId={AGENT_ID} />
            ) : (
              /* Placeholder докато няма Agent ID */
              <div className="bg-dark-800 border border-amber-500/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ height: 420 }}>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                  🎙️
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">AI Гласов рецепционист</h3>
                  <p className="text-slate-400 text-sm">
                    Powered by ElevenLabs — реален глас, ~100ms латентност, български език
                  </p>
                </div>
                <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs max-w-xs">
                  Добавете <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> в .env за да активирате гласовия агент
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-4">Какво може AI рецепционистът:</h4>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-brand-green text-xs flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick prompts */}
            <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-3 text-sm">Пробвайте тези въпроси в чата:</h4>
              <div className="space-y-2">
                {["Колко струва почистване?", "Искам час при ортодонт утре", "Какви услуги предлагате?"].map(
                  (prompt, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 bg-dark-700 rounded-lg text-slate-400 text-sm border border-white/5"
                    >
                      💬 {prompt}
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
