import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface RetellTranscriptItem {
  role: string;
  content: string;
}

interface RetellCallEndedEvent {
  event: "call_ended";
  call: {
    call_id: string;
    agent_id: string;
    from_number: string;
    duration?: number;
    end_timestamp?: number;
    start_timestamp?: number;
    transcript?: string;
    metadata?: Record<string, string>;
  };
}

interface RetellCallAnalyzedEvent {
  event: "call_analyzed";
  call: {
    call_id: string;
    agent_id: string;
    from_number: string;
    duration?: number;
    transcript?: string;
    call_analysis?: {
      call_summary?: string;
      user_sentiment?: string;
      custom_analysis_data?: {
        outcome?: string;
        patientName?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        service?: string;
      };
    };
    metadata?: Record<string, string>;
  };
}

type RetellEvent = RetellCallEndedEvent | RetellCallAnalyzedEvent;

function parseTranscript(transcriptText: string): RetellTranscriptItem[] {
  if (!transcriptText) return [];
  try {
    const lines = transcriptText.split("\n");
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        if (line.startsWith("User:")) {
          return { role: "user", content: line.replace("User:", "").trim() };
        } else if (line.startsWith("Agent:")) {
          return { role: "assistant", content: line.replace("Agent:", "").trim() };
        }
        return { role: "system", content: line.trim() };
      });
  } catch {
    return [];
  }
}

function determineSentiment(
  sentimentStr: string | undefined
): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  if (!sentimentStr) return "NEUTRAL";
  const lower = sentimentStr.toLowerCase();
  if (lower.includes("positive") || lower.includes("satisfied")) return "POSITIVE";
  if (lower.includes("negative") || lower.includes("frustrated")) return "NEGATIVE";
  return "NEUTRAL";
}

function determineOutcome(
  analysisData: RetellCallAnalyzedEvent["call"]["call_analysis"]
): "BOOKED" | "INFO" | "TRANSFERRED" | "MISSED" | "SPAM" {
  if (!analysisData?.custom_analysis_data) return "INFO";
  const outcome = analysisData.custom_analysis_data.outcome?.toUpperCase();
  if (outcome === "BOOKED") return "BOOKED";
  if (outcome === "TRANSFERRED") return "TRANSFERRED";
  if (outcome === "MISSED") return "MISSED";
  if (outcome === "SPAM") return "SPAM";
  return "INFO";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RetellEvent;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find clinic by retell agent ID
    const agentId = body.call.agent_id;
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("retell_agent_id", agentId)
      .single();

    if (!clinic) {
      console.log("No clinic found for agent ID:", agentId);
      return NextResponse.json({ received: true });
    }

    if (body.event === "call_ended") {
      const call = body.call;
      const duration =
        call.duration ||
        (call.end_timestamp && call.start_timestamp
          ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
          : 0);

      await supabase.from("call_logs").insert({
        clinic_id: clinic.id,
        retell_call_id: call.call_id,
        caller_number: call.from_number || "Неизвестен",
        duration_seconds: duration,
        transcript: parseTranscript(call.transcript || ""),
        outcome: "INFO",
        sentiment: "NEUTRAL",
      });
    } else if (body.event === "call_analyzed") {
      const call = body.call;
      const analysis = call.call_analysis;
      const outcome = determineOutcome(analysis);
      const sentiment = determineSentiment(analysis?.user_sentiment);

      // Update existing call log or create new one
      const { data: existingLog } = await supabase
        .from("call_logs")
        .select("id")
        .eq("retell_call_id", call.call_id)
        .single();

      let appointmentId: string | undefined;

      // Auto-create appointment if booked
      if (outcome === "BOOKED" && analysis?.custom_analysis_data) {
        const { patientName, appointmentDate, appointmentTime, service } =
          analysis.custom_analysis_data;

        if (patientName && appointmentDate && appointmentTime) {
          const { data: appointment } = await supabase
            .from("appointments")
            .insert({
              clinic_id: clinic.id,
              patient_name: patientName,
              patient_phone: call.from_number || "Неизвестен",
              service: service || "Консултация",
              date: appointmentDate,
              time: appointmentTime,
              duration_minutes: 30,
              status: "CONFIRMED",
              created_by: "AI_PHONE",
              notes: `Записан от AI телефонен рецепционист. Call ID: ${call.call_id}`,
            })
            .select("id")
            .single();

          appointmentId = appointment?.id;
        }
      }

      const duration = call.duration || 0;

      if (existingLog) {
        await supabase
          .from("call_logs")
          .update({
            outcome,
            sentiment,
            appointment_id: appointmentId,
          })
          .eq("id", existingLog.id);
      } else {
        await supabase.from("call_logs").insert({
          clinic_id: clinic.id,
          retell_call_id: call.call_id,
          caller_number: call.from_number || "Неизвестен",
          duration_seconds: duration,
          transcript: parseTranscript(call.transcript || ""),
          outcome,
          sentiment,
          appointment_id: appointmentId,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Retell webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
