import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Vercel Cron — runs every 5 minutes
// vercel.json: { "crons": [{ "path": "/api/cron/social", "schedule": "*/5 * * * *" }] }
export async function GET() {
  try {
    const supabase = createClient();

    const now = new Date().toISOString();

    // Намираме всички scheduled постове, чието време е дошло
    const { data: posts, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (error) throw error;
    if (!posts?.length) return NextResponse.json({ published: 0 });

    const apiKey = process.env.AYRSHARE_API_KEY;
    let published = 0;

    for (const post of posts) {
      try {
        const body: Record<string, unknown> = {
          post: post.content,
          platforms: post.platforms,
        };
        if (post.media_urls?.length) body.mediaUrls = post.media_urls;

        const res = await fetch("https://app.ayrshare.com/api/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        await supabase
          .from("social_posts")
          .update({
            status: res.ok ? "published" : "failed",
            published_at: res.ok ? new Date().toISOString() : null,
            ayrshare_id: data.id ?? null,
            post_ids: data.postIds ?? {},
          })
          .eq("id", post.id);

        if (res.ok) published++;
      } catch {
        await supabase
          .from("social_posts")
          .update({ status: "failed" })
          .eq("id", post.id);
      }
    }

    return NextResponse.json({ published, total: posts.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
