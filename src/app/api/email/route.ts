import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "deyan.s1001@gmail.com";
const FROM_ADDRESS = "DentAI <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dentai-theta.vercel.app";

const PLAN_LABELS: Record<string, string> = {
  BASIC: "Базов",
  PRO: "Про",
  CLINIC_PLUS: "Клиника+",
  STARTER: "Стартов",
  PROFESSIONAL: "Професионален",
  ANNUAL: "Годишен",
};

function getPaymentConfirmationHtml(clinicName: string, plan: string, amount: number): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><title>Потвърждение за плащане - DentAI</title></head>
<body style="margin:0;padding:0;background-color:#070d1b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070d1b;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0a1024);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🦷</div>
          <h1 style="color:#3b82f6;font-size:32px;margin:0;">DentAI</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#e2e8f0;font-size:24px;margin:0 0 16px;">✅ Плащането е успешно!</h2>
          <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
            Здравейте, ${clinicName}! Вашето плащане беше обработено успешно. Добре дошли в DentAI!
          </p>
          <div style="background:#0c1329;border-radius:12px;padding:24px;border:1px solid rgba(59,130,246,0.2);margin-bottom:32px;">
            <table width="100%">
              <tr><td style="color:#94a3b8;font-size:14px;padding:8px 0;">Клиника:</td><td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;">${clinicName}</td></tr>
              <tr><td style="color:#94a3b8;font-size:14px;padding:8px 0;">План:</td><td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;">${PLAN_LABELS[plan] || plan}</td></tr>
              <tr><td style="color:#94a3b8;font-size:14px;padding:8px 0;">Сума:</td><td style="color:#22c55e;font-size:16px;font-weight:700;text-align:right;">€${amount}/мес</td></tr>
            </table>
          </div>
          <a href="${APP_URL}/dashboard" style="display:block;background:#3b82f6;color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;">Отидете към Dashboard →</a>
        </td></tr>
        <tr><td style="background:#070d1b;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="color:#475569;font-size:13px;margin:0;">© 2025 DentAI · При въпроси: <a href="mailto:deyan.s1001@gmail.com" style="color:#3b82f6;">deyan.s1001@gmail.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getWelcomeHtml(clinicName: string, ownerName: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><title>Добре дошли в DentAI!</title></head>
<body style="margin:0;padding:0;background-color:#070d1b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070d1b;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0a1024);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🦷</div>
          <h1 style="color:#3b82f6;font-size:32px;margin:0;">DentAI</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 16px;">Добре дошли, ${ownerName}! 🎉</h2>
          <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
            Регистрацията на <strong style="color:#e2e8f0;">${clinicName}</strong> в DentAI е успешна!
            Имате <strong style="color:#22c55e;">14 дни безплатен пробен период</strong>.
          </p>
          <a href="${APP_URL}/dashboard" style="display:block;background:#3b82f6;color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;">Започнете сега →</a>
        </td></tr>
        <tr><td style="background:#070d1b;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="color:#475569;font-size:13px;margin:0;">© 2025 DentAI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getSocialReviewHtml(posts: { content: string; category: string }[]): string {
  const postsHtml = posts.map((p, i) => `
    <div style="background:#0c1329;border-radius:12px;padding:20px;border:1px solid rgba(139,92,246,0.2);margin-bottom:16px;">
      <div style="color:#8b5cf6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${p.category}</div>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${p.content}</p>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><title>Нови постове за одобрение - DentAI</title></head>
<body style="margin:0;padding:0;background-color:#070d1b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070d1b;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#2d1b69,#0a1024);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">📱</div>
          <h1 style="color:#8b5cf6;font-size:28px;margin:0;">Нови постове за одобрение</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">${posts.length} пост${posts.length > 1 ? "а" : ""} чакат твоето одобрение</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${postsHtml}
          <a href="${APP_URL}/admin/social" style="display:block;background:#8b5cf6;color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;margin-top:8px;">Одобри постовете →</a>
        </td></tr>
        <tr><td style="background:#070d1b;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="color:#475569;font-size:13px;margin:0;">© 2025 DentAI Admin</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await request.json() as {
      type: "payment_confirmation" | "welcome" | "social_review" | "contact" | "blog_review";
      to?: string;
      clinicName?: string;
      ownerName?: string;
      plan?: string;
      amount?: number;
      posts?: { content: string; category: string }[];
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      // blog_review fields
      postId?: string;
      title?: string;
      excerpt?: string;
      content?: string;
      category?: string;
      approveUrl?: string;
      rejectUrl?: string;
    };

    const { type } = body;
    let subject = "";
    let html = "";
    let to = body.to || ADMIN_EMAIL;

    if (type === "payment_confirmation") {
      if (!body.clinicName) return NextResponse.json({ error: "Липсват данни" }, { status: 400 });
      subject = `✅ Плащането е потвърдено — ${body.clinicName} | DentAI`;
      html = getPaymentConfirmationHtml(body.clinicName, body.plan || "", body.amount || 0);
    } else if (type === "welcome") {
      if (!body.clinicName) return NextResponse.json({ error: "Липсват данни" }, { status: 400 });
      subject = `🦷 Добре дошли в DentAI, ${body.clinicName}!`;
      html = getWelcomeHtml(body.clinicName, body.ownerName || body.clinicName);
    } else if (type === "contact") {
      subject = `📩 Ново съобщение от ${body.name || "непознат"} — DentAI`;
      html = `<div style="font-family:Arial;background:#070d1b;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="color:#3b82f6;">📩 Ново съобщение от сайта</h2>
        <p><strong>От:</strong> ${body.name} (${body.email})</p>
        <p><strong>Тема:</strong> ${body.subject || "—"}</p>
        <hr style="border-color:rgba(255,255,255,0.1);margin:16px 0;">
        <p style="white-space:pre-wrap;">${body.message}</p>
      </div>`;
      to = ADMIN_EMAIL;
    } else if (type === "blog_review") {
      subject = `📝 Нова статия за одобрение: "${body.title}" — DentAI`;
      html = `<!DOCTYPE html>
<html lang="bg"><head><meta charset="UTF-8"><title>Нова статия за одобрение</title></head>
<body style="margin:0;padding:0;background:#070d1b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070d1b;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="650" cellpadding="0" cellspacing="0" style="background:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);max-width:650px;">
        <tr><td style="background:linear-gradient(135deg,#1a3a2a,#0a1024);padding:32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">📝</div>
          <h1 style="color:#22c55e;font-size:22px;margin:0;">Нова статия чака одобрение</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Категория: ${body.category}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#e2e8f0;font-size:20px;margin:0 0 12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">${body.title}</h2>
          <p style="color:#94a3b8;font-size:14px;font-style:italic;margin:0 0 20px;">${body.excerpt}</p>
          <div style="background:#0c1329;border-radius:10px;padding:20px;border:1px solid rgba(255,255,255,0.06);max-height:300px;overflow:hidden;margin-bottom:24px;">
            <p style="color:#cbd5e1;font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">${(body.content || "").slice(0, 800)}${(body.content || "").length > 800 ? "..." : ""}</p>
          </div>
          <table width="100%"><tr>
            <td width="48%">
              <a href="${body.rejectUrl}" style="display:block;background:#1a0a0a;border:2px solid #ef4444;color:#ef4444;text-decoration:none;padding:14px;border-radius:10px;font-size:15px;font-weight:bold;text-align:center;">
                ❌ Отхвърли
              </a>
            </td>
            <td width="4%"></td>
            <td width="48%">
              <a href="${body.approveUrl}" style="display:block;background:#22c55e;color:#000;text-decoration:none;padding:14px;border-radius:10px;font-size:15px;font-weight:bold;text-align:center;">
                ✅ Одобри и публикувай
              </a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#070d1b;padding:20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="color:#475569;font-size:12px;margin:0;">© 2025 DentAI Admin</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
      to = ADMIN_EMAIL;
    } else if (type === "social_review") {
      const posts = body.posts || [];
      subject = `📱 ${posts.length} нови поста за одобрение — DentAI`;
      html = getSocialReviewHtml(posts);
      to = ADMIN_EMAIL;
    } else {
      return NextResponse.json({ error: "Невалиден тип имейл" }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Грешка при изпращане на имейл" }, { status: 500 });
  }
}
