import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Facebook (Meta Graph API — безплатно) ────────────────────────────────────
async function postToFacebook(content: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return { ok: false, error: "Липсват Facebook credentials" };

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, access_token: token }),
  });
  const data = await res.json();
  if (data.error) return { ok: false, error: data.error.message };
  return { ok: true, id: data.id };
}

// ─── Instagram (Meta Graph API — безплатно) ───────────────────────────────────
async function postToInstagram(content: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const igUserId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!igUserId || !token) return { ok: false, error: "Липсват Instagram credentials" };

  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption: content, media_type: "REELS", access_token: token }),
  });
  const container = await containerRes.json();
  if (container.error) return { ok: false, error: container.error.message };

  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const published = await publishRes.json();
  if (published.error) return { ok: false, error: published.error.message };
  return { ok: true, id: published.id };
}

// ─── LinkedIn (безплатно) ─────────────────────────────────────────────────────
async function postToLinkedIn(content: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !authorUrn) return { ok: false, error: "Липсват LinkedIn credentials" };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: JSON.stringify(err) };
  }
  return { ok: true, id: res.headers.get("x-restli-id") ?? "ok" };
}

// ─── TikTok (Content Posting API — безплатно) ────────────────────────────────
async function postToTikTok(content: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "Липсва TikTok Access Token" };

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/text/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      post_info: {
        title: content.slice(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error?.message ?? "TikTok грешка" };
  return { ok: true, id: data?.data?.publish_id };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, platforms, postId } = await req.json();
    const selected: string[] = platforms ?? ["facebook", "instagram", "linkedin", "tiktok"];

    const results: Record<string, { ok: boolean; id?: string; error?: string }> = {};

    await Promise.allSettled([
      selected.includes("facebook") && postToFacebook(content).then((r) => { results.facebook = r; }),
      selected.includes("instagram") && postToInstagram(content).then((r) => { results.instagram = r; }),
      selected.includes("linkedin") && postToLinkedIn(content).then((r) => { results.linkedin = r; }),
      selected.includes("tiktok") && postToTikTok(content).then((r) => { results.tiktok = r; }),
    ].filter(Boolean));

    const anySuccess = Object.values(results).some((r) => r.ok);

    if (postId) {
      await supabase.from("social_posts").update({
        status: anySuccess ? "published" : "failed",
        published_at: anySuccess ? new Date().toISOString() : null,
        post_ids: results,
      }).eq("id", postId);
    }

    return NextResponse.json({ success: anySuccess, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Неочаквана грешка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
