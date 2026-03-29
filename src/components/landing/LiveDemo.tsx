"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Send, Mic, MicOff, Volume2 } from "lucide-react";
import ChatWidget from "@/components/chat/ChatWidget";

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const FEATURES = [
  "Разбира телефонни номера",
  "Записва часове автоматично",
  "Изпраща имейл потвърждения",
  "Говори перфектен български",
];

interface VoiceMessage {
  role: "ai" | "user";
  text: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface DemoForm {
  clinicName: string;
  workingHours: string;
  mainService: string;
}

function getSpeechRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export default function LiveDemo() {
  const [demoForm, setDemoForm] = useState<DemoForm>({ clinicName: "", workingHours: "", mainService: "" });
  const [clinicContext, setClinicContext] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionClass() !== null);
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "bg-BG";
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  const sendVoiceMessage = useCallback(async (text: string) => {
    if (!text.trim() || voiceLoading) return;
    setVoiceInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setVoiceLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode: "voice" }),
      });
      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      speak(data.reply);
    } catch {
      const errMsg = "Грешка при свързване. Моля, опитайте отново.";
      setMessages((prev) => [...prev, { role: "ai", text: errMsg }]);
    } finally {
      setVoiceLoading(false);
    }
  }, [voiceLoading]);

  function toggleMic() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "bg-BG";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setVoiceInput(transcript);
        sendVoiceMessage(transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function startCall() {
    setIsCallActive(true);
    setCallSeconds(0);
    setMessages([{ role: "ai", text: "Дентал Смайл, добър ден! С какво мога да Ви помогна?" }]);
    setVoiceInput("");
  }

  function endCall() {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setIsCallActive(false);
    setCallSeconds(0);
    setMessages([]);
    setVoiceInput("");
    setVoiceLoading(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, voiceLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

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
            Попълнете информацията за вашата клиника и вижте как DentAI ще говори с вашите пациенти
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

          {/* Right: Phone demo card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Phone demo card */}
            <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                {!isCallActive ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <Phone className="text-brand-green animate-ring" size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-white mb-2">
                      AI Телефонен рецепционист
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Говорете с микрофона или пишете — AI отговаря на глас на български
                    </p>

                    {/* Browser support warning */}
                    {speechSupported === false && (
                      <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                        Вашият браузър не поддържа Web Speech API. Използвайте Chrome за гласов режим.
                      </div>
                    )}

                    <button
                      onClick={startCall}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-green-600 text-white font-semibold transition-all shadow-lg shadow-green-500/30"
                    >
                      <Phone size={18} />
                      Обади се на AI Demo
                    </button>
                    <p className="text-xs text-slate-600 mt-3">
                      {speechSupported
                        ? "Говорете с микрофон или въведете текст"
                        : "Текстова симулация на телефонно обаждане"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col"
                    style={{ height: 420 }}
                  >
                    {/* Call header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-green-500/15 border-b border-green-500/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
                        <span className="text-brand-green font-semibold text-sm">В разговор</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSpeaking && (
                          <Volume2 size={14} className="text-brand-blue animate-pulse" />
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight">Дентал Смайл</p>
                          <p className="text-slate-400 text-xs">AI Рецепционист</p>
                        </div>
                        <Phone size={16} className="text-brand-green" />
                      </div>
                      <span className="text-brand-green font-mono text-sm font-semibold">
                        {formatTime(callSeconds)}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-brand-blue/20 border border-brand-blue/30 text-blue-100"
                                : "bg-dark-700 border border-white/8 text-slate-300"
                            }`}
                          >
                            {msg.role === "ai" && (
                              <span className="text-brand-green font-medium text-xs block mb-0.5">
                                AI Рецепционист:
                              </span>
                            )}
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {voiceLoading && (
                        <div className="flex justify-start">
                          <div className="bg-dark-700 border border-white/8 px-3 py-2 rounded-xl flex gap-1 items-center">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input row */}
                    <div className="px-4 py-3 border-t border-white/8 flex items-center gap-2">
                      {/* Mic button */}
                      {speechSupported && (
                        <button
                          onClick={toggleMic}
                          disabled={voiceLoading}
                          title={isListening ? "Спри слушането" : "Говорете"}
                          className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
                            isListening
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-dark-700 hover:bg-dark-600 border border-white/10 text-slate-300 hover:text-white"
                          }`}
                        >
                          {isListening && (
                            <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-40" />
                          )}
                          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                      )}

                      <input
                        type="text"
                        value={voiceInput}
                        onChange={(e) => setVoiceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendVoiceMessage(voiceInput);
                        }}
                        placeholder={isListening ? "Слушам..." : "Говорете или пишете..."}
                        disabled={voiceLoading || isListening}
                        className="flex-1 px-3 py-2 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue transition-colors disabled:opacity-50"
                      />
                      <button
                        onClick={() => sendVoiceMessage(voiceInput)}
                        disabled={voiceLoading || !voiceInput.trim() || isListening}
                        className="p-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-all disabled:opacity-40"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={endCall}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all"
                      >
                        <PhoneOff size={15} />
                        Затвори
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Features grid */}
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
