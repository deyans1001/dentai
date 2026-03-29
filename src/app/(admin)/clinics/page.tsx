"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Clinic } from "@/types";
import { formatDate, PLAN_LABELS, PLAN_COLORS } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClinics();
  }, []);

  async function loadClinics() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("clinics")
      .select("*")
      .order("created_at", { ascending: false });

    setClinics((data || []) as Clinic[]);
    setLoading(false);
  }

  const filtered = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400",
    TRIAL: "bg-yellow-500/20 text-yellow-400",
    EXPIRED: "bg-red-500/20 text-red-400",
    CANCELLED: "bg-slate-500/20 text-slate-400",
  };
  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Активна ✅",
    TRIAL: "Пробен 🟡",
    EXPIRED: "Изтекъл 🔴",
    CANCELLED: "Отменен",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Клиники</h1>
        <p className="text-slate-400 text-sm mt-1">Всички регистрирани клиники</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсете по клиника, град или имейл..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
        />
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <p className="text-slate-400 text-sm">{filtered.length} клиники</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Клиника</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Град</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Статус</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">План</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((clinic) => (
                  <tr key={clinic.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{clinic.name}</p>
                      <p className="text-slate-500 text-xs">{clinic.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{clinic.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[clinic.status] || ""}`}>
                        {STATUS_LABELS[clinic.status] || clinic.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${PLAN_COLORS[clinic.plan] || ""}`}>
                        {PLAN_LABELS[clinic.plan] || clinic.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(clinic.created_at)}</td>
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
