"use client";

import { motion } from "framer-motion";

const PAIN_CARDS = [
  {
    emoji: "🏃",
    stat: "Конкурентът",
    statColor: "text-brand-purple",
    title: "вече използва AI",
    subtitle: "докато вие отговаряте на обаждания ръчно",
    accentColor: "from-purple-500/50",
    borderColor: "border-purple-500/20",
  },
];

export default function PainPoints() {
  return (
    <section id="pain-points" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white">
            Колко пациенти губите{" "}
            <span className="text-brand-red">ВСЕКИ ДЕН?</span>
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
            Реалността е безмилостна. Докато вие сте зает с пациент на стол,
            телефонът звъни — и пациентите отиват при конкурента.
          </p>
        </motion.div>

        <div className="grid gap-6 max-w-md mx-auto">
          {PAIN_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative bg-dark-800 border ${card.borderColor} rounded-2xl overflow-hidden`}
            >
              {/* Top accent line */}
              <div className={`h-1 w-full bg-gradient-to-r ${card.accentColor} to-transparent`} />

              <div className="p-8 text-center">
                <div className="text-5xl mb-4">{card.emoji}</div>
                <p className={`text-4xl font-heading font-bold ${card.statColor} mb-2`}>
                  {card.stat}
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{card.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
