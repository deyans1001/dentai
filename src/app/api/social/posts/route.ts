import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        content: body.content,
        platforms: body.platforms ?? ["facebook", "instagram", "linkedin", "tiktok"],
        category: body.category ?? "post",
        status: body.status ?? "draft",
        scheduled_at: body.scheduledAt ?? null,
        media_urls: body.mediaUrls ?? [],
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID липсва" }, { status: 400 });

    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
