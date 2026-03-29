"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

interface KPIData {
  totalClinics: number;
  mrr: number;
  callsToday: number;
  conversionRate: number;
  revenueByMonth: { month: string; revenue: number }[];
  recentActivity: { type: string; description: string; time: string }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { count: totalClinics } = await supabase
      .from("clinics")
      .select("*", { count: "exact", head: true });

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, created_at, clinic_id")
      .eq("status", "COMPLETED")
      .order("created_at", { ascending: false });

    const mrr = (payments || []).reduce((sum, p) => sum + (p.amount / 12), 0);

    const today = new Date().toISOString().split("T")[0];
    const { count: callsToday } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`);

    const { count: activeClinics } = await supabase
      .from("clinics")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    const conversionRate = totalClinics && totalClinics > 0
      ? Math.round(((activeClinics || 0) / totalClinics) * 100)
      : 0;

    // Revenue by month (last 6 months)
    const revenueByMonth = [];
    const months = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
      const monthPayments = (payments || []).filter(
        (p) => p.created_at >= monthStart && p.created_at <= monthEnd
      );
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      revenueByMonth.push({ month: months[date.getMonth()], revenue });
    }

    // Recent activity
    const { data: recentClinics } = await supabase
      .from("clinics")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentActivity = (recentClinics || []).map((c) => ({
      type: "clinic",
      description: `Нова клиника: ${c.name}`,
      time: c.created_at,
    }));

    setData({
      totalClinics: totalClinics || 0,
      mrr: Math.round(mrr),
      callsToday: callsToday || 0,
      conversionRate,
      revenueByMonth,
      recentActivity,
    });
    setLoading(false);
  }

  const KPI_CARDS = [
    { label: "Общо клиники", value: data?.totalClinics || 0, color: "text-brand-blue", emoji: "🏥" },
    { label: "MRR (Месечни приходи)", value: `€${data?.mrr || 0}`, color: "text-brand-green", emoji: "💰" },
    { label: "Обаждания днес", value: data?.callsToday || 0, color: "text-brand-purple", emoji: "📞" },
    { label: "Conversion Rate", value: `${data?.conversionRate || 0}%`, color: "text-brand-gold", emoji: "📈" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Admin Преглед</h1>
        <p className="text-slate-400 text-sm mt-1">KPI и бизнес показатели</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-dark-800 border border-white/8 rounded-2xl p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : KPI_CARDS.map((card) => (
              <div key={card.label} className="bg-dark-800 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{card.emoji}</span>
                  <span className={`text-3xl font-heading font-bold ${card.color}`}>{card.value}</span>
                </div>
                <p className="text-slate-400 text-sm">{card.label}</p>
              </div>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-dark-800 border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Приходи (последни 6 месеца)</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: "#0a1024", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  formatter={(value: string | number | undefined) => [`€${value ?? 0}`, "Приходи"] as [string, string]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Последна активност</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    🏥
                  </div>
                  <div>
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{formatDateTime(activity.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
