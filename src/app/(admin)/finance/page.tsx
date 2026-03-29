"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Payment } from "@/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate, formatCurrency, PLAN_LABELS } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";

interface RevenueData {
  month: string;
  revenue: number;
}

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<(Payment & { clinics?: { name: string } })[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ mrr: 0, totalRevenue: 0, churnRate: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: paymentData } = await supabase
      .from("payments")
      .select("*, clinics(name)")
      .eq("status", "COMPLETED")
      .order("created_at", { ascending: false });

    const allPayments = (paymentData || []) as (Payment & { clinics?: { name: string } })[];
    setPayments(allPayments);

    // Calculate stats
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const mrr = totalRevenue > 0 ? Math.round(totalRevenue / 12) : 0;

    setStats({ mrr, totalRevenue: Math.round(totalRevenue), churnRate: 5 });

    // Revenue by month
    const months = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];
    const monthData: RevenueData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthPayments = allPayments.filter(
        (p) => p.created_at >= monthStart && p.created_at <= monthEnd
      );
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      monthData.push({ month: months[date.getMonth()], revenue });
    }
    setRevenueData(monthData);
    setLoading(false);
  }

  function exportCSV() {
    const headers = ["Дата,Клиника,План,Сума (EUR),Статус"];
    const rows = payments.map((p) => [
      formatDate(p.created_at),
      (p as Payment & { clinics?: { name: string } }).clinics?.name || "—",
      PLAN_LABELS[p.plan] || p.plan,
      p.amount,
      p.status,
    ].join(","));

    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dentai_payments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Финанси</h1>
          <p className="text-slate-400 text-sm mt-1">Приходи и плащания</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 border border-white/10 text-slate-300 text-sm transition-all"
        >
          <Download size={15} />
          Изтеглете CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "MRR", value: `€${stats.mrr}`, color: "text-brand-green" },
          { label: "Общо приходи", value: `€${stats.totalRevenue}`, color: "text-brand-blue" },
          { label: "Churn Rate", value: `${stats.churnRate}%`, color: "text-brand-red" },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-800 border border-white/8 rounded-xl p-5">
            <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Приходи — последни 6 месеца</h2>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: "#0a1024", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                formatter={(value: string | number | undefined) => [`€${value ?? 0}`, "Приходи"] as [string, string]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} name="Приходи" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payments table */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold">Плащания ({payments.length})</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-slate-400">Няма плащания</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Дата</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Клиника</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">План</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Сума</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-white text-sm">
                      {(p as Payment & { clinics?: { name: string } }).clinics?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{PLAN_LABELS[p.plan] || p.plan}</td>
                    <td className="px-4 py-3">
                      <span className="text-brand-green font-semibold">{formatCurrency(p.amount, p.currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                        p.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {p.status === "COMPLETED" ? "Успешно" : p.status === "FAILED" ? "Грешка" : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
