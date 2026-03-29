import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Стартов",
  PROFESSIONAL: "Професионален",
  ANNUAL: "Годишен",
};

function getPaymentConfirmationHtml(clinicName: string, plan: string, amount: number): string {
  return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Потвърждение за плащане - DentAI</title>
</head>
<body style="margin:0;padding:0;background-color:#070d1b;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070d1b;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#0a1024);padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🦷</div>
              <h1 style="color:#3b82f6;font-size:32px;margin:0;font-weight:700;">DentAI</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">AI Рецепционист за Дентални Клиники</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#e2e8f0;font-size:24px;margin:0 0 16px;">✅ Плащането е успешно!</h2>
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
                Здравейте, ${clinicName}! Вашето плащане беше обработено успешно. Добре дошли в DentAI!
              </p>

              <!-- Plan details -->
              <div style="background:#0c1329;border-radius:12px;padding:24px;border:1px solid rgba(59,130,246,0.2);margin-bottom:32px;">
                <h3 style="color:#3b82f6;margin:0 0 16px;font-size:16px;text-transform:uppercase;letter-spacing:1px;">ДЕТАЙЛИ НА АБОНАМЕНТА</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#94a3b8;font-size:14px;padding:8px 0;">Клиника:</td>
                    <td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;">${clinicName}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:14px;padding:8px 0;">План:</td>
                    <td style="color:#e2e8f0;font-size:14px;font-weight:600;text-align:right;">${PLAN_LABELS[plan] || plan} план</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:14px;padding:8px 0;">Сума:</td>
                    <td style="color:#22c55e;font-size:16px;font-weight:700;text-align:right;">€${amount}</td>
                  </tr>
                </table>
              </div>

              <!-- Next steps -->
              <h3 style="color:#e2e8f0;font-size:18px;margin:0 0 16px;">🚀 Следващи стъпки:</h3>
              <ul style="color:#94a3b8;font-size:15px;line-height:2;padding-left:20px;margin:0 0 32px;">
                <li>Влезте в <strong style="color:#3b82f6;">dashboard.dentai.bg</strong></li>
                <li>Свържете Google Calendar</li>
                <li>Персонализирайте AI рецепциониста</li>
                <li>Получете Retell AI телефонен номер</li>
              </ul>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display:block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;">
                Отидете към Dashboard →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#070d1b;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#475569;font-size:13px;margin:0;">
                © 2025 DentAI · AI рецепционист за дентални клиники в България
              </p>
              <p style="color:#475569;font-size:12px;margin:8px 0 0;">
                При въпроси: <a href="mailto:support@dentai.bg" style="color:#3b82f6;">support@dentai.bg</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getWelcomeHtml(clinicName: string, ownerName: string): string {
  return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <title>Добре дошли в DentAI!</title>
</head>
<body style="margin:0;padding:0;background-color:#070d1b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070d1b;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0a1024;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#0a1024);padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🦷</div>
              <h1 style="color:#3b82f6;font-size:32px;margin:0;">DentAI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 16px;">Добре дошли, ${ownerName}! 🎉</h2>
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Регистрацията на <strong style="color:#e2e8f0;">${clinicName}</strong> в DentAI е успешна!
                Имате <strong style="color:#22c55e;">9 дни безплатен пробен период</strong>.
              </p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Вашият AI рецепционист ще отговаря на обаждания 24/7, ще записва часове автоматично
                и ще увеличи приходите на клиниката ви.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display:block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;">
                Започнете сега →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#070d1b;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#475569;font-size:13px;margin:0;">© 2025 DentAI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await request.json() as {
      type: "payment_confirmation" | "welcome";
      to: string;
      clinicName: string;
      ownerName?: string;
      plan?: string;
      amount?: number;
    };

    const { type, to, clinicName, ownerName, plan, amount } = body;

    if (!type || !to || !clinicName) {
      return NextResponse.json(
        { error: "Липсват задължителни полета" },
        { status: 400 }
      );
    }

    let subject = "";
    let html = "";

    if (type === "payment_confirmation") {
      subject = `✅ Плащането е потвърдено — ${clinicName} | DentAI`;
      html = getPaymentConfirmationHtml(clinicName, plan || "", amount || 0);
    } else if (type === "welcome") {
      subject = `🦷 Добре дошли в DentAI, ${clinicName}!`;
      html = getWelcomeHtml(clinicName, ownerName || clinicName);
    } else {
      return NextResponse.json(
        { error: "Невалиден тип имейл" },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: "DentAI <noreply@dentai.bg>",
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Грешка при изпращане на имейл" },
      { status: 500 }
    );
  }
}
