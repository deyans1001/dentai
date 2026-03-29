import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "auth") {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
        ],
        prompt: "consent",
      });
      return NextResponse.redirect(authUrl);
    }

    if (action === "callback") {
      const code = searchParams.get("code");
      const clinicId = searchParams.get("state");

      if (!code) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
        );
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const { data: calendarList } = await calendar.calendarList.list();
      const primaryCalendar = calendarList.items?.find((c) => c.primary);

      if (clinicId) {
        const supabase = createClient();
        await supabase
          .from("clinics")
          .update({
            google_calendar_token: tokens,
            google_calendar_id: primaryCalendar?.id || "primary",
            updated_at: new Date().toISOString(),
          })
          .eq("id", clinicId);
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?calendar=connected`
      );
    }

    if (action === "events") {
      const clinicId = searchParams.get("clinicId");
      if (!clinicId) {
        return NextResponse.json({ error: "Липсва ID на клиника" }, { status: 400 });
      }

      const supabase = createClient();
      const { data: clinic } = await supabase
        .from("clinics")
        .select("google_calendar_token, google_calendar_id")
        .eq("id", clinicId)
        .single();

      if (!clinic?.google_calendar_token) {
        return NextResponse.json({ error: "Google Calendar не е свързан" }, { status: 400 });
      }

      oauth2Client.setCredentials(clinic.google_calendar_token);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const { data: events } = await calendar.events.list({
        calendarId: clinic.google_calendar_id || "primary",
        timeMin: now.toISOString(),
        timeMax: nextMonth.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      });

      return NextResponse.json({ events: events.items || [] });
    }

    return NextResponse.json({ error: "Невалидно действие" }, { status: 400 });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Грешка при работа с Google Calendar" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      clinicId: string;
      summary: string;
      date: string;
      time: string;
      duration: number;
      description?: string;
      attendeeEmail?: string;
    };

    const { clinicId, summary, date, time, duration, description, attendeeEmail } = body;

    const supabase = createClient();
    const { data: clinic } = await supabase
      .from("clinics")
      .select("google_calendar_token, google_calendar_id")
      .eq("id", clinicId)
      .single();

    if (!clinic?.google_calendar_token) {
      return NextResponse.json({ error: "Google Calendar не е свързан" }, { status: 400 });
    }

    oauth2Client.setCredentials(clinic.google_calendar_token);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

    const attendees = attendeeEmail ? [{ email: attendeeEmail }] : [];

    const { data: event } = await calendar.events.insert({
      calendarId: clinic.google_calendar_id || "primary",
      requestBody: {
        summary,
        description: description || "",
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Europe/Sofia",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Europe/Sofia",
        },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    return NextResponse.json({ event, eventId: event.id });
  } catch (error) {
    console.error("Calendar create event error:", error);
    return NextResponse.json(
      { error: "Грешка при създаване на събитие в Google Calendar" },
      { status: 500 }
    );
  }
}
