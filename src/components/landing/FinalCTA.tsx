"use client";

import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-[600px] h-[600px] rounded-full bg-brand-blue/10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
            Готови ли сте да спрете
            <br />
            <span className="gradient-text">загубата на пациенти?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Присъединете се към денталните клиники в България, които вече работят с AI
            рецепционист. Стартирайте безплатно — без кредитна карта.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-10 py-4 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-lg transition-all animate-pulse-glow hover:scale-105 active:scale-95"
            >
              Стартирайте безплатно — 9 дни
            </a>
            <button
              onClick={() =>
                document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-10 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-all"
            >
              Вижте демото отново
            </button>
          </div>

          <p className="text-slate-600 text-sm mt-6">
            Без кредитна карта · Без скрити такси · Настройка за 30 минути
          </p>
        </motion.div>
      </div>
    </section>
  );
}
