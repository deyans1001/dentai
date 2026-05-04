import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Липсва Stripe подпис" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Невалиден webhook подпис" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const clinicId = session.metadata?.clinic_id;
      const plan = session.metadata?.plan as "BASIC" | "PRO" | "CLINIC_PLUS";

      if (!clinicId || !plan) {
        console.error("Missing metadata in Stripe session");
        return NextResponse.json({ received: true });
      }

      // Update clinic status
      await supabase
        .from("clinics")
        .update({
          status: "ACTIVE",
          plan,
        })
        .eq("id", clinicId);

      // Determine amount
      const amountMap: Record<string, number> = {
        BASIC: 199,
        PRO: 299,
        CLINIC_PLUS: 449,
      };

      // Save payment record
      await supabase.from("payments").insert({
        clinic_id: clinicId,
        amount: amountMap[plan] || 0,
        currency: "EUR",
        plan,
        stripe_payment_id: session.payment_intent as string,
        stripe_subscription_id: session.subscription as string ?? null,
        status: "COMPLETED",
        receipt_url: session.url ?? null,
      });

      // Get clinic info for email
      const { data: clinic } = await supabase
        .from("clinics")
        .select("email, name")
        .eq("id", clinicId)
        .single();

      if (clinic) {
        // Send confirmation email
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment_confirmation",
            to: clinic.email,
            clinicName: clinic.name,
            plan,
            amount: amountMap[plan] || 0,
          }),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json({ received: true });
  }
}
