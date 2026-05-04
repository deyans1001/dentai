import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Фиксирани цени — не се менят
const PLAN_CONFIGS = {
  BASIC: {
    name: "Базов план",
    amount: 19900, // €199/месец
    description: "AI рецепционист — Базов план (чатбот, записване 24/7)",
  },
  PRO: {
    name: "Про план",
    amount: 29900, // €299/месец
    description: "AI рецепционист — Про план (гласов рецепционист + Google Calendar)",
  },
  CLINIC_PLUS: {
    name: "Клиника+ план",
    amount: 44900, // €449/месец
    description: "AI рецепционист — Клиника+ план (до 3 клиники + SMS)",
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIGS;

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json() as { clinicId: string; plan: PlanKey };
    const { clinicId, plan } = body;

    if (!clinicId || !plan) {
      return NextResponse.json({ error: "Липсват данни за клиниката или плана" }, { status: 400 });
    }

    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig) {
      return NextResponse.json({ error: "Невалиден план" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard/settings?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { clinic_id: clinicId, plan },
      locale: "bg",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Грешка при създаване на плащане. Моля, опитайте отново." }, { status: 500 });
  }
}
