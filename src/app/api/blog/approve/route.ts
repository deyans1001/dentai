import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");

  if (!id || !["approve", "reject"].includes(action || "")) {
    return new NextResponse("Невалидна заявка", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (action === "approve") {
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return new NextResponse(`<html><body style="font-family:Arial;background:#070d1b;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center;"><div style="font-size:48px;">❌</div><h2>Грешка при одобрение</h2><p style="color:#94a3b8;">${error.message}</p></div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Get the post slug for redirect
    const { data: post } = await supabase
      .from("blog_posts")
      .select("slug, title")
      .eq("id", id)
      .single();

    return new NextResponse(`
      <html><head><meta charset="utf-8"><title>Одобрено — DentAI</title>
      <meta http-equiv="refresh" content="3;url=${APP_URL}/blog/${post?.slug || ""}">
      </head>
      <body style="font-family:Arial;background:#070d1b;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;max-width:500px;padding:40px;">
          <div style="font-size:64px;margin-bottom:16px;">✅</div>
          <h1 style="color:#22c55e;margin:0 0 8px;">Блогът е публикуван!</h1>
          <p style="color:#94a3b8;margin:0 0 24px;">"${post?.title}"</p>
          <a href="${APP_URL}/blog/${post?.slug || ""}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Виж публикацията →</a>
        </div>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });

  } else {
    await supabase
      .from("blog_posts")
      .update({ status: "rejected" })
      .eq("id", id);

    return new NextResponse(`
      <html><head><meta charset="utf-8"><title>Отхвърлено — DentAI</title></head>
      <body style="font-family:Arial;background:#070d1b;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;padding:40px;">
          <div style="font-size:64px;margin-bottom:16px;">🗑️</div>
          <h1 style="color:#ef4444;margin:0 0 8px;">Блогът е отхвърлен</h1>
          <p style="color:#94a3b8;">Следващата статия ще бъде генерирана автоматично.</p>
        </div>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
