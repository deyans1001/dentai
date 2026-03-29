import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_CONFIGS = {
  STARTER: {
    name: "Стартов план",
    amount: 29900, // €299 in cents
    currency: "eur",
    description: "AI рецепционист - Стартов план за дентални клиники",
  },
  PROFESSIONAL: {
    name: "Професионален план",
    amount: 149900, // €1499 in cents
    currency: "eur",
    description: "AI рецепционист - Професионален план за дентални клиники",
  },
  ANNUAL: {
    name: "Годишен план",
    amount: 279900, // €2799 in cents
    currency: "eur",
    description: "AI рецепционист - Годишен план за дентални клиники (12 месеца)",
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIGS;

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json() as { clinicId: string; plan: PlanKey };
    const { clinicId, plan } = body;

    if (!clinicId || !plan) {
      return NextResponse.json(
        { error: "Липсват данни за клиниката или плана" },
        { status: 400 }
      );
    }

    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig) {
      return NextResponse.json(
        { error: "Невалиден план" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?payment=success&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
      metadata: {
        clinic_id: clinicId,
        plan,
      },
      locale: "bg",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Грешка при създаване на плащане. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
