import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
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
    const staffInserts = staff
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

    // Send welcome email (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app"}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "welcome", to: email, clinicName, ownerName }),
    }).catch(() => {});

    return NextResponse.json({ success: true, clinicId: clinic.id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
