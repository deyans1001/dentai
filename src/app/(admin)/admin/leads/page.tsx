"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Lead, LeadStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";

const COLUMNS: LeadStatus[] = [
  "НОВ",
  "ПРОУЧЕН",
  "КОНТАКТУВАН",
  "ЗАИНТЕРЕСОВАН",
  "ДЕМО",
  "ПРЕГОВОРИ",
  "КОНВЕРТИРАН",
];

const COLUMN_COLORS: Record<string, string> = {
  "НОВ": "border-slate-500/30",
  "ПРОУЧЕН": "border-blue-500/30",
  "КОНТАКТУВАН": "border-purple-500/30",
  "ЗАИНТЕРЕСОВАН": "border-yellow-500/30",
  "ДЕМО": "border-orange-500/30",
  "ПРЕГОВОРИ": "border-amber-500/30",
  "КОНВЕРТИРАН": "border-green-500/30",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500/20 text-red-400",
  2: "bg-yellow-500/20 text-yellow-400",
  3: "bg-green-500/20 text-green-400",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Висок",
  2: "Среден",
  3: "Нисък",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ clinic_name: "", contact_name: "", email: "", phone: "", city: "", priority: 2 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data || []) as Lead[]);
    setLoading(false);
  }

  async function saveLead() {
    if (!form.clinic_name) return;
    setSaving(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.from("leads").insert({
      clinic_name: form.clinic_name,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      priority: form.priority,
      status: "НОВ",
      tags: [],
    });
    setShowAdd(false);
    setForm({ clinic_name: "", contact_name: "", email: "", phone: "", city: "", priority: 2 });
    setSaving(false);
    loadLeads();
  }

  async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
  }

  function handleDragStart(leadId: string) {
    setDragging(leadId);
  }

  function handleDrop(status: LeadStatus) {
    if (dragging) {
      updateLeadStatus(dragging, status);
      setDragging(null);
    }
  }

  const groupedLeads = COLUMNS.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Leads</h1>
          <p className="text-slate-400 text-sm mt-1">Kanban дъска за управление на потенциални клиенти</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-medium"
        >
          <Plus size={16} />
          Добави lead
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 bg-dark-800 rounded-xl p-4 space-y-3">
              <Skeleton className="h-5 w-20" />
              {Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="h-24 w-full" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <div
              key={status}
              className={`flex-shrink-0 w-64 bg-dark-800 border ${COLUMN_COLORS[status] || "border-white/8"} rounded-xl`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="p-3 border-b border-white/8">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">{status}</span>
                  <span className="text-xs text-slate-500 bg-dark-700 px-2 py-0.5 rounded-full">
                    {groupedLeads[status]?.length || 0}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[100px]">
                {(groupedLeads[status] || []).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-dark-700 border border-white/8 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-brand-blue/30 transition-all"
                  >
                    <p className="text-white text-sm font-medium mb-1">{lead.clinic_name}</p>
                    {lead.city && <p className="text-slate-500 text-xs mb-2">📍 {lead.city}</p>}
                    {lead.phone && <p className="text-slate-400 text-xs mb-2">📞 {lead.phone}</p>}
                    <div className="flex items-center justify-between">
                      {lead.google_rating && (
                        <span className="text-xs text-yellow-400">⭐ {lead.google_rating}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${PRIORITY_COLORS[lead.priority] || ""}`}>
                        {PRIORITY_LABELS[lead.priority] || ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add lead modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-white font-heading font-bold">Добавяне на lead</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Клиника *", key: "clinic_name" as keyof typeof form, placeholder: "Дентал Смайл" },
                { label: "Контакт", key: "contact_name" as keyof typeof form, placeholder: "Д-р Иван Иванов" },
                { label: "Телефон", key: "phone" as keyof typeof form, placeholder: "+359 88..." },
                { label: "Имейл", key: "email" as keyof typeof form, placeholder: "clinic@..." },
                { label: "Град", key: "city" as keyof typeof form, placeholder: "Пловдив" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={form[field.key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Приоритет</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm outline-none focus:border-brand-blue"
                >
                  <option value={1}>Висок</option>
                  <option value={2}>Среден</option>
                  <option value={3}>Нисък</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/8">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-300 text-sm">Отказ</button>
              <button onClick={saveLead} disabled={saving || !form.clinic_name} className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm disabled:opacity-50">
                {saving ? "Запазване..." : "Добавете"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead detail panel */}
      {selectedLead && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-dark-800 border-l border-white/10 shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <h3 className="text-white font-semibold">{selectedLead.clinic_name}</h3>
            <button onClick={() => setSelectedLead(null)} className="text-slate-400"><X size={18} /></button>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Статус", value: selectedLead.status },
              { label: "Контакт", value: selectedLead.contact_name || "—" },
              { label: "Телефон", value: selectedLead.phone || "—" },
              { label: "Имейл", value: selectedLead.email || "—" },
              { label: "Град", value: selectedLead.city || "—" },
              { label: "Google рейтинг", value: selectedLead.google_rating ? `⭐ ${selectedLead.google_rating}` : "—" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs">{item.label}</p>
                <p className="text-white text-sm font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
            {selectedLead.notes && (
              <div>
                <p className="text-slate-500 text-xs mb-1">Бележки</p>
                <p className="text-slate-300 text-sm bg-dark-700 rounded-lg p-3">{selectedLead.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
