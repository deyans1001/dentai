"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "Трябва ли ми кредитна карта за trial?",
    a: "Не. 9 или 14 дни напълно безплатно, без никакви задължения. Въвеждате имейл и парола — нищо повече.",
  },
  {
    q: "Мога ли да анулирам по всяко време?",
    a: "Да, без неустойки или обяснения. Анулирате с едно кликване от таблото си.",
  },
  {
    q: "На какъв език говори ботът?",
    a: "Само на български. DentAI е специално създаден за дентални клиники в България.",
  },
  {
    q: "Колко бързо се активира?",
    a: "До 24 часа след регистрация. Обикновено е готов за по-малко от час.",
  },
  {
    q: "Какво ако не съм доволен?",
    a: "Връщаме парите в рамките на 30 дни — без въпроси и без обяснения.",
  },
  {
    q: "Как AI рецепционистът разпознава на какъв език говори пациентът?",
    a: "DentAI е специално обучен на български език и разпознава естествена реч — включително диалектни изрази, номера и имена. Системата автоматично обработва всички обаждания на български без нужда от настройки.",
  },
  {
    q: "Ще замени ли AI моя персонал?",
    a: "Не — DentAI е допълнение към вашия екип. Той поема обажданията, когато рецепционистът е зает или клиниката е затворена. Вашият персонал се освобождава от рутинни задачи и може да се фокусира върху пациентите.",
  },
  {
    q: "Колко обаждания може да обработи системата едновременно?",
    a: "Неограничено. За разлика от жив рецепционист, DentAI може да обработва стотици паралелни обаждания без изчакване или пропуснати повиквания.",
  },
  {
    q: "Как се интегрира с Google Calendar?",
    a: "С едно кликване свързвате Google Calendar профила на клиниката. DentAI автоматично проверява свободните часове и записва директно в календара — без ръчна намеса.",
  },
  {
    q: "Сигурни ли са данните на пациентите?",
    a: "Да. DentAI е съвместим с GDPR и работи с криптиране на всички данни. Личните данни на пациентите се съхраняват на EU сървъри и никога не се споделят с трети страни.",
  },
  {
    q: "Мога ли да персонализирам как AI говори?",
    a: "Да. Може да зададете персонализиран поздрав, тона на разговор, специфични инструкции и информация за услугите ви. AI се адаптира към стила на вашата клиника.",
  },
  {
    q: "Какво се случва при технически проблем?",
    a: "При всякакъв технически проблем системата автоматично пренасочва обажданията към вашия реален телефон. Пациентът никога не остава без отговор.",
  },
  {
    q: "Колко бързо мога да стартирам?",
    a: "Настройката отнема по-малко от 30 минути. Попълвате информацията за клиниката, свързвате Google Calendar и AI рецепционистът е готов за работа — още същия ден.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-[620px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-heading font-bold text-white mb-4">
            Често задавани въпроси
          </h2>
          <p className="text-slate-400">Всичко, което трябва да знаете за DentAI</p>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-dark-800 rounded-xl border overflow-hidden transition-colors",
                  isOpen ? "border-brand-blue/40" : "border-white/8"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className={cn("font-medium text-sm", isOpen ? "text-white" : "text-slate-300")}>
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      "text-xl font-light ml-4 flex-shrink-0 transition-transform duration-300",
                      isOpen ? "rotate-45 text-brand-blue" : "text-slate-500"
                    )}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
