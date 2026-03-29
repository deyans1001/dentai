"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CallLog } from "@/types";
import { formatDateTime, formatDuration, CALL_OUTCOME_LABELS, CALL_OUTCOME_COLORS, CALL_SENTIMENT_EMOJI } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TranscriptItem {
  role: string;
  content: string;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, aiHandled: 0, avgDuration: 0, topService: "" });

  // Filters
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    loadData();
  }, [filterOutcome, filterSentiment, dateFrom]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!clinic) return;

    let query = supabase
      .from("call_logs")
      .select("*")
      .eq("clinic_id", clinic.id)
      .gte("created_at", `${dateFrom}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterOutcome) query = query.eq("outcome", filterOutcome);
    if (filterSentiment) query = query.eq("sentiment", filterSentiment);

    const { data } = await query;
    const callData = (data || []) as CallLog[];
    setCalls(callData);

    // Calculate stats
    const total = callData.length;
    const aiHandled = callData.filter((c) => c.outcome === "BOOKED").length;
    const avgDuration = total > 0 ? Math.round(callData.reduce((sum, c) => sum + c.duration_seconds, 0) / total) : 0;

    setStats({ total, aiHandled, avgDuration, topService: aiHandled > 0 ? "Записани часове" : "—" });
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Обаждания</h1>
        <p className="text-slate-400 text-sm mt-1">История на AI телефонни разговори</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Общо обаждания", value: stats.total, color: "text-white" },
          { label: "AI записани", value: `${stats.aiHandled} (${stats.total > 0 ? Math.round((stats.aiHandled / stats.total) * 100) : 0}%)`, color: "text-brand-green" },
          { label: "Средна продължителност", value: formatDuration(stats.avgDuration), color: "text-brand-blue" },
          { label: "Топ резултат", value: stats.topService, color: "text-brand-gold" },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-800 border border-white/8 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
            {loading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <p className={`text-xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-dark-800 border border-white/8 rounded-xl p-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">От дата</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Резултат</label>
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Всички</option>
            <option value="BOOKED">Записан час</option>
            <option value="INFO">Информация</option>
            <option value="TRANSFERRED">Прехвърлен</option>
            <option value="MISSED">Пропуснато</option>
            <option value="SPAM">Спам</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Настроение</label>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Всички</option>
            <option value="POSITIVE">Позитивно 😊</option>
            <option value="NEUTRAL">Неутрално 😐</option>
            <option value="NEGATIVE">Негативно 😞</option>
          </select>
        </div>
      </div>

      {/* Calls table */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold">История на обажданията ({calls.length})</h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📵</div>
            <p className="text-slate-400">Няма обаждания за избрания период</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {calls.map((call) => (
              <div key={call.id}>
                <button
                  onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/2 transition-colors text-left"
                >
                  <div className="text-xl flex-shrink-0">{CALL_SENTIMENT_EMOJI[call.sentiment]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{call.caller_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CALL_OUTCOME_COLORS[call.outcome]}`}>
                        {CALL_OUTCOME_LABELS[call.outcome]}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatDateTime(call.created_at)} · {formatDuration(call.duration_seconds)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-slate-500">
                    {expandedId === call.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expandedId === call.id && (
                  <div className="px-4 pb-4 bg-dark-700/50">
                    <div className="pt-3 border-t border-white/5">
                      <h4 className="text-slate-400 text-xs font-medium mb-3">ТРАНСКРИПТ НА РАЗГОВОРА</h4>
                      {(call.transcript || []).length === 0 ? (
                        <p className="text-slate-500 text-sm">Няма достъпен транскрипт</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(call.transcript as TranscriptItem[]).map((t, i) => (
                            <div
                              key={i}
                              className={`flex gap-2 text-sm ${t.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] px-3 py-1.5 rounded-xl ${
                                  t.role === "user"
                                    ? "bg-brand-blue/20 text-blue-200"
                                    : "bg-dark-600 text-slate-300"
                                }`}
                              >
                                {t.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
