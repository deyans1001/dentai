import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { internalHeaders } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email: string;
      password: string;
      clinicName: string;
      ownerName: string;
      phone: string;
      city: string;
      address: string;
      website?: string;
      workingHours: Record<string, unknown>;
      services: string[];
      plan: string;
      staff: { name: string; role: string; working_days: string[]; working_hours: { open: string; close: string } }[];
    };

    const { email, password, clinicName, ownerName, phone, city, address, website, workingHours, services, plan, staff } = body;

    if (!email || !password || !clinicName) {
      return NextResponse.json({ error: "Липсват задължителни полета" }, { status: 400 });
    }

    // Use service role — bypasses email confirmation and RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user (auto-confirm email)
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Този имейл вече е регистриран. Влезте в акаунта си." }, { status: 409 });
      }
      console.error("[register] createUser error:", signUpError.message);
      const m = signUpError.message.toLowerCase();
      if (m.includes("password")) {
        return NextResponse.json({ error: "Паролата е твърде слаба. Използвайте поне 6 символа." }, { status: 400 });
      }
      if (m.includes("email")) {
        return NextResponse.json({ error: "Невалиден имейл адрес." }, { status: 400 });
      }
      return NextResponse.json({ error: "Грешка при регистрация. Моля, опитайте отново." }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Грешка при създаване на акаунт" }, { status: 500 });
    }

    const userId = authData.user.id;

    // Insert clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        user_id: userId,
        name: clinicName,
        owner_name: ownerName,
        email,
        phone,
        city,
        address,
        website: website || null,
        working_hours: workingHours,
        services,
        plan: plan || "PRO",
        status: "TRIAL",
      })
      .select("id")
      .single();

    if (clinicError || !clinic) {
      // Rollback — delete the created user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Грешка при създаване на клиника" }, { status: 500 });
    }

    // Insert staff
    const staffInserts = (Array.isArray(staff) ? staff : [])
      .filter((s) => s.name.trim())
      .map((s) => ({
        clinic_id: clinic.id,
        name: s.name,
        role: s.role,
        working_days: s.working_days,
        working_hours: s.working_hours,
        is_active: true,
      }));

    if (staffInserts.length > 0) {
      await supabase.from("staff").insert(staffInserts);
    }

    // Welcome email — чакаме го (иначе serverless функцията може да приключи преди заявката),
    // но грешка в имейла не проваля регистрацията.
    try {
      const emailRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app"}/api/email`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({ type: "welcome", to: email, clinicName, ownerName }),
      });
      if (!emailRes.ok) console.error("[register] welcome email failed:", emailRes.status);
    } catch (emailError) {
      console.error("[register] welcome email error:", emailError);
    }

    return NextResponse.json({ success: true, clinicId: clinic.id });
  } catch (error: unknown) {
    console.error("[register] unexpected error:", error);
    return NextResponse.json({ error: "Неочаквана грешка. Моля, опитайте отново." }, { status: 500 });
  }
}
