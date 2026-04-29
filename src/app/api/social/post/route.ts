import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, platforms, mediaUrls, scheduledAt, postId } = await req.json();

    const apiKey = process.env.AYRSHARE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Ayrshare API ключът не е конфигуриран." }, { status: 500 });

    const body: Record<string, unknown> = {
      post: content,
      platforms: platforms ?? ["facebook", "instagram", "linkedin", "tiktok"],
    };

    if (mediaUrls?.length) body.mediaUrls = mediaUrls;
    if (scheduledAt) body.scheduleDate = new Date(scheduledAt).toISOString();

    const res = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message ?? `Грешка ${res.status}`);
    }

    // Update status in DB
    if (postId) {
      await supabase
        .from("social_posts")
        .update({
          status: scheduledAt ? "scheduled" : "published",
          published_at: scheduledAt ? null : new Date().toISOString(),
          ayrshare_id: data.id,
          post_ids: data.postIds ?? {},
        })
        .eq("id", postId);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
