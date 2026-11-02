"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    emoji: "📞",
    color: "blue",
    title: "Пациентът се обажда",
    description:
      "Вашият AI рецепционист отговаря мигновено на всяко обаждане, 24 часа в денонощието, 7 дни в седмицата — на перфектен български.",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    numColor: "text-brand-blue",
    badgeBg: "bg-brand-blue",
  },
  {
    num: "02",
    emoji: "🤖",
    color: "purple",
    title: "AI обработва заявката",
    description:
      "Разбира контекста, проверява свободните часове, отговаря на въпроси за цени и услуги — точно като жив рецепционист, само по-бърз.",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    numColor: "text-brand-purple",
    badgeBg: "bg-brand-purple",
  },
  {
    num: "03",
    emoji: "📅",
    color: "green",
    title: "Часът е записан автоматично",
    description:
      "Записва часа директно в Google Calendar, изпраща SMS/имейл потвърждение на пациента и ви уведомява — без ваша намеса.",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    numColor: "text-brand-green",
    badgeBg: "bg-brand-green",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-brand-blue text-sm font-medium mb-4">
            КАК РАБОТИ
          </span>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white">
            3 прости стъпки
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
            От обаждане до записан час — напълно автоматично
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className={`relative ${step.bgColor} border ${step.borderColor} rounded-2xl p-8 text-center`}
            >
              {/* Number badge */}
              <div
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 ${step.badgeBg} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
              >
                {i + 1}
              </div>

              <div className="text-5xl mb-4 mt-2">{step.emoji}</div>
              <p className={`text-5xl font-heading font-bold ${step.numColor} opacity-20 mb-2`}>
                {step.num}
              </p>
              <h3 className="text-xl font-heading font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Connector line (desktop) */}
        <div className="hidden md:flex items-center justify-center mt-4 -mt-16 mb-16 relative pointer-events-none">
          <div className="w-full max-w-2xl h-px bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green opacity-20 relative top-0" />
        </div>
      </div>
    </section>
  );
}
