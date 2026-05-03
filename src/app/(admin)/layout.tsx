"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const ADMIN_NAV = [
  { emoji: "🏠", label: "Преглед", href: "/admin" },
  { emoji: "🏥", label: "Клиники", href: "/admin/clinics" },
  { emoji: "👥", label: "Leads", href: "/admin/leads" },
  { emoji: "📱", label: "Социални мрежи", href: "/admin/social" },
  { emoji: "📊", label: "Маркетинг", href: "/admin/marketing" },
  { emoji: "💰", label: "Финанси", href: "/admin/finance" },
];

// Simple admin check - in production use is_admin flag in database
const ADMIN_EMAIL = "admin@dentai.bg";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/login");
      } else {
        setAuthChecked(true);
      }
    };
    checkAdmin();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-slate-400">Проверка на достъп...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 w-64 bg-dark-800 border-r border-white/8 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-pink-500 flex items-center justify-center text-lg">
              🦷
            </div>
            <div>
              <span className="text-sm font-heading font-bold text-white">DentAI Admin</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-purple/15 text-white border border-brand-purple/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{item.emoji}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/8">
          <a href="/dashboard" className="flex items-center gap-2 text-slate-400 text-sm hover:text-white px-3 py-2">
            ← Назад към Dashboard
          </a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-white/8">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400">
            <Menu size={22} />
          </button>
          <span className="font-heading font-bold text-white">Admin Panel</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
