"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "biannual" | "annual";

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "1 месец",
  biannual: "6 месеца",
  annual: "12 месеца",
};

const PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  biannual: 6,
  annual: 12,
};

interface Plan {
  id: string;
  name: string;
  prices: Record<BillingPeriod, number>;
  trial: string;
  includes: string[];
  excludes: string[];
  popular: boolean;
  badge: string | null;
  scarcity: string | null;
}

const PLANS: Plan[] = [
  {
    id: "BASIC",
    name: "Базов",
    prices: { monthly: 199, biannual: 170, annual: 139 },
    trial: "9 дни безплатно, без кредитна карта",
    includes: ["AI чатбот", "Записване на часове", "24/7 достъпност", "1 клиника"],
    excludes: ["Гласов рецепционист", "Google Calendar", "SMS потвърждения"],
    popular: false,
    badge: null,
    scarcity: null,
  },
  {
    id: "PRO",
    name: "Про",
    prices: { monthly: 299, biannual: 239, annual: 199 },
    trial: "14 дни безплатно, без кредитна карта",
    includes: ["Всичко от Базов", "Гласов рецепционист", "Google Calendar интеграция"],
    excludes: ["SMS потвърждения"],
    popular: true,
    badge: "Най-популярен",
    scarcity: null,
  },
  {
    id: "CLINIC_PLUS",
    name: "Клиника+",
    prices: { monthly: 449, biannual: 359, annual: 299 },
    trial: "14 дни безплатно, без кредитна карта",
    includes: [
      "Всичко от Про",
      "До 3 клиники",
      "SMS потвърждения",
      "Персонално въвеждане в системата",
    ],
    excludes: [],
    popular: false,
    badge: "Най-изгоден",
    scarcity: null,
  },
];

export default function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const clinicId = localStorage.getItem("clinicId");
      if (!clinicId) {
        window.location.href = `/register?plan=${planId}`;
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Грешка при създаване на плащане");
      }
    } catch {
      alert("Грешка при свързване. Моля, опитайте отново.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            10x по-евтино от жив рецепционист
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Жив рецепционист струва €850–950/месец. DentAI — от €139.
          </p>
        </motion.div>

        {/* Billing period toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-dark-800 border border-white/10 rounded-xl p-1 gap-1">
            {(["monthly", "biannual", "annual"] as BillingPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  period === p
                    ? "bg-brand-blue text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {PERIOD_LABELS[p]}
                {p === "annual" && (
                  <span className="ml-1.5 text-xs text-brand-green font-semibold">
                    −30%
                  </span>
                )}
                {p === "biannual" && (
                  <span className="ml-1.5 text-xs text-brand-gold font-semibold">
                    −15%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={cn(
                "relative rounded-2xl overflow-hidden",
                plan.popular ? "md:-mt-4" : ""
              )}
              style={
                plan.popular
                  ? {
                      border: "2px solid #3b82f6",
                      boxShadow: "0 0 40px rgba(59, 130, 246, 0.2)",
                    }
                  : { border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={cn(
                    "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold",
                    plan.popular
                      ? "bg-brand-blue/20 border border-brand-blue/40 text-brand-blue"
                      : "bg-brand-gold/20 border border-brand-gold/40 text-brand-gold"
                  )}
                >
                  {plan.badge}
                </div>
              )}

              <div className="bg-dark-800 p-8">
                <h3 className="text-xl font-heading font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-slate-500 text-xs mb-5">{plan.trial}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-heading font-bold text-white">
                      €{plan.prices[period]}
                    </span>
                    <span className="text-slate-400">/мес</span>
                  </div>
                  {period !== "monthly" && (
                    <p className="text-slate-500 text-xs mt-1">
                      Общо €{plan.prices[period] * PERIOD_MONTHS[period]} за{" "}
                      {PERIOD_LABELS[period]}
                    </p>
                  )}
                </div>

                {/* Includes */}
                <ul className="space-y-2.5 mb-3">
                  {plan.includes.map((item, fi) => (
                    <li
                      key={fi}
                      className="flex items-center gap-2.5 text-sm text-slate-300"
                    >
                      <Check size={15} className="text-brand-green flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Excludes */}
                {plan.excludes.length > 0 && (
                  <ul className="space-y-2.5 mb-6">
                    {plan.excludes.map((item, fi) => (
                      <li
                        key={fi}
                        className="flex items-center gap-2.5 text-sm text-slate-600"
                      >
                        <X size={15} className="text-slate-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.excludes.length === 0 && <div className="mb-6" />}

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-semibold text-base transition-all",
                    plan.popular
                      ? "bg-brand-blue hover:bg-blue-600 text-white"
                      : "bg-dark-700 hover:bg-dark-600 border border-white/10 text-white",
                    loading === plan.id
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {loading === plan.id ? "Зареждане..." : "Започнете безплатно"}
                </button>

                {plan.scarcity && (
                  <p className="text-center text-xs text-brand-gold mt-3">
                    {plan.scarcity}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-10">
          Без договор · Анулиране по всяко време · Гаранция 30 дни
        </p>
      </div>
    </section>
  );
}
