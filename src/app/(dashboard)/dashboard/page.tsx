"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import ChatWidget from "@/components/chat/ChatWidget";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Appointment, Clinic } from "@/types";
import { formatTime, APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/utils";

interface Stats {
  todayAppointments: number;
  todayCalls: number;
  aiHandledPercent: number;
  savedClients: number;
  weeklyData: { day: string; count: number }[];
  upcomingAppointments: Appointment[];
}

const DAYS_BG = ["Нед", "Пон", "Вт", "Ср", "Чет", "Пет", "Съб"];

export default function DashboardPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!clinicData) {
      setLoading(false);
      return;
    }

    setClinic(clinicData as Clinic);

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Today's appointments
    const { count: todayCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicData.id)
      .eq("date", today);

    // Today's calls
    const { count: todayCallsCount } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicData.id)
      .gte("created_at", `${today}T00:00:00`);

    // AI booked calls
    const { count: aiBookedCount } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicData.id)
      .eq("outcome", "BOOKED")
      .gte("created_at", `${today}T00:00:00`);

    // Upcoming appointments today
    const { data: upcoming } = await supabase
      .from("appointments")
      .select("*, staff(name, role)")
      .eq("clinic_id", clinicData.id)
      .eq("date", today)
      .gte("time", `${String(now.getHours()).padStart(2, "0")}:00`)
      .order("time", { ascending: true })
      .limit(5);

    // Weekly data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicData.id)
        .eq("date", dateStr);
      weeklyData.push({ day: DAYS_BG[date.getDay()], count: count || 0 });
    }

    const totalCalls = todayCallsCount || 0;
    const aiHandledPercent = totalCalls > 0 ? Math.round(((aiBookedCount || 0) / totalCalls) * 100) : 0;

    setStats({
      todayAppointments: todayCount || 0,
      todayCalls: totalCalls,
      aiHandledPercent,
      savedClients: aiBookedCount || 0,
      weeklyData,
      upcomingAppointments: (upcoming || []) as Appointment[],
    });

    setLoading(false);
  }

  const STAT_CARDS = [
    {
      label: "Часове днес",
      value: stats?.todayAppointments ?? 0,
      color: "text-brand-blue",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      emoji: "📅",
      href: "/dashboard/appointments?today=1",
    },
    {
      label: "AI обаждания",
      value: stats?.todayCalls ?? 0,
      color: "text-brand-purple",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      emoji: "📞",
      href: "/dashboard/calls?today=1",
    },
    {
      label: "AI обработени %",
      value: `${stats?.aiHandledPercent ?? 0}%`,
      color: "text-brand-gold",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      emoji: "🤖",
      href: "/dashboard/calls",
    },
    {
      label: "Спасени клиенти",
      value: stats?.savedClients ?? 0,
      color: "text-brand-green",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      emoji: "✅",
      href: "/dashboard/calls?saved=1",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">
          {loading ? <Skeleton className="h-7 w-48" /> : `Здравейте, ${clinic?.owner_name?.split(" ")[0] || ""}! 👋`}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {clinic?.name} · Преглед на деня
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : STAT_CARDS.map((card) => (
              <a
                key={card.label}
                href={card.href}
                className={`${card.bg} border ${card.border} rounded-2xl p-5 hover:scale-[1.02] transition-all cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className={`text-3xl font-heading font-bold ${card.color}`}>{card.value}</span>
                </div>
                <p className="text-slate-400 text-sm">{card.label}</p>
              </a>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="lg:col-span-2 bg-dark-800 border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Часове тази седмица</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#0a1024", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Часове" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's appointments */}
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Предстоящи часове</h2>
            <a href="/dashboard/appointments" className="text-xs text-brand-blue hover:text-blue-400">
              Всички →
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stats?.upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-slate-500 text-sm">Няма предстоящи часове</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{apt.patient_name}</p>
                    <p className="text-slate-500 text-xs truncate">{apt.service}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-brand-blue text-sm font-medium">{formatTime(apt.time)}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${APPOINTMENT_STATUS_COLORS[apt.status]}`}
                    >
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1">AI Асистент</h2>
        <p className="text-slate-400 text-sm mb-4">
          Попитайте за статистики, анализи или информация за клиниката
        </p>
        {clinic && <ChatWidget clinicId={clinic.id} className="h-[420px]" />}
      </div>
    </div>
  );
}
