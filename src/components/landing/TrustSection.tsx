"use client";

import { motion } from "framer-motion";

const TRUST_ITEMS = [
  { icon: "💳", title: "Без кредитна карта", desc: "Нулев риск при trial" },
  { icon: "🛡️", title: "Гаранция 30 дни", desc: "Връщаме парите без въпроси" },
  { icon: "⚡", title: "Активен за 24 часа", desc: "Бърз setup" },
  { icon: "📊", title: "87% продължават след trial-а", desc: "Проверено с реални клиники" },
  { icon: "🔓", title: "Без дългосрочен договор", desc: "Свобода по всяко време" },
  { icon: "🇧🇬", title: "Говори перфектен български", desc: "Създаден за България" },
];

export default function TrustSection() {
  return (
    <section className="pb-16 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 bg-dark-800 border border-white/8 rounded-xl px-4 py-4"
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
