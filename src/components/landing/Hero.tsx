"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PhoneCall, MessageSquare } from "lucide-react";

const CHAT_BUBBLES = [
  { role: "user", text: "Добър ден! Искам час при зъболекар за утре." },
  { role: "bot", text: "Разбира се! Имаме свободен час утре в 10:00 при Д-р Петров. Подходящ ли е?" },
  { role: "user", text: "Да, перфектно!" },
  { role: "bot", text: "✅ Записан! Ще получите SMS потвърждение." },
];

function CounterStat({ target, suffix, color }: { target: number; suffix: string; color: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);

    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className={`font-heading font-bold ${color}`}>
      {count}
      {suffix}
    </span>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-brand-purple/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              Първият AI рецепционист в България
            </motion.div>

            {/* H1 */}
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-tight mb-6">
              <span className="text-white">Вашата клиника</span>
              <br />
              <span className="gradient-text">никога не пропуска</span>
              <br />
              <span className="text-white">обаждане</span>
            </h1>

            {/* Cost comparison banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="bg-dark-800 border border-white/10 rounded-xl px-5 py-3 max-w-xl mx-auto lg:mx-0">
                <p className="text-sm text-slate-200 leading-relaxed">
                  Рецепционист в България ={" "}
                  <span className="text-brand-gold font-semibold">€850–950/месец + осигуровки</span>
                  . DentAI го замества от{" "}
                  <span className="text-brand-green font-semibold">€199/месец</span>
                  . Без болнични. Без отпуски.{" "}
                  <span className="text-white font-semibold">24/7.</span>
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto lg:mx-0">
                3 клиники стартираха trial тази седмица.
              </p>
            </motion.div>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              AI рецепционист, работещ{" "}
              <strong className="text-white">24/7</strong>, записва часове,
              отговаря на въпроси и увеличава приходите ви с{" "}
              <strong className="text-brand-gold">40%</strong> без наемане на
              допълнителен персонал.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <a
                href="/register"
                className="px-8 py-4 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-lg transition-all animate-pulse-glow hover:scale-105 active:scale-95 text-center"
              >
                🚀 Безплатен старт — 9 дни
              </a>
              <button
                onClick={() => {
                  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-all text-center"
              >
                Вижте демо →
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center lg:justify-start">
              <div>
                <p className="text-3xl font-heading font-bold">
                  <CounterStat target={312} suffix="+" color="text-brand-red" />
                </p>
                <p className="text-sm text-slate-500 mt-1">Пропуснати обаждания/месец</p>
              </div>
              <div className="hidden sm:block w-px bg-white/10" />
              <div>
                <p className="text-3xl font-heading font-bold">
                  <CounterStat target={47000} suffix=" лв" color="text-brand-gold" />
                </p>
                <p className="text-sm text-slate-500 mt-1">Изгубени приходи/годишно</p>
              </div>
              <div className="hidden sm:block w-px bg-white/10" />
              <div>
                <p className="text-3xl font-heading font-bold text-brand-green">24/7</p>
                <p className="text-sm text-slate-500 mt-1">Достъпност на AI</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative animate-float">
              {/* Glow */}
              <div className="absolute inset-0 bg-brand-blue/20 rounded-[3rem] blur-3xl scale-110" />

              {/* Phone frame */}
              <div
                className="relative w-72 bg-dark-800 rounded-[3rem] overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0a1024, #0c1329)",
                  border: "2px solid rgba(59, 130, 246, 0.3)",
                  boxShadow: "0 0 60px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  padding: "12px",
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 mb-3">
                  <span>09:41</span>
                  <div className="flex gap-1">
                    <span>●●●</span>
                    <span>WiFi</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Chat header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-t-2xl border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-sm">
                    🦷
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">DentAI</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                      <span className="text-[10px] text-slate-400">Онлайн</span>
                    </div>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="bg-dark-700 rounded-b-2xl p-3 space-y-2 min-h-64">
                  {CHAT_BUBBLES.map((bubble, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.4 }}
                      className={`flex ${bubble.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                          bubble.role === "user"
                            ? "bg-brand-blue text-white rounded-br-sm"
                            : "bg-dark-600 text-slate-300 rounded-bl-sm"
                        }`}
                      >
                        {bubble.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input area */}
                <div className="flex items-center gap-2 mt-3 px-2">
                  <div className="flex-1 bg-dark-700 rounded-full h-8 px-3 flex items-center">
                    <span className="text-xs text-slate-600">Напишете съобщение...</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center">
                    <MessageSquare size={14} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Floating call badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute -right-8 top-12 bg-dark-800 border border-green-500/40 rounded-2xl px-4 py-2 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall size={14} className="text-brand-green" />
                  <div>
                    <p className="text-[10px] text-slate-400">AI обаждане</p>
                    <p className="text-xs font-bold text-white">Час записан ✓</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
