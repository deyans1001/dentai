"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { emoji: "📊", label: "Табло", href: "/dashboard" },
  { emoji: "📅", label: "Часове", href: "/dashboard/appointments" },
  { emoji: "📞", label: "Обаждания", href: "/dashboard/calls" },
  { emoji: "💬", label: "AI Чатбот", href: "/dashboard/chatbot" },
  { emoji: "📱", label: "Социални мрежи", href: "/dashboard/social" },
  { emoji: "👥", label: "Персонал", href: "/dashboard/staff" },
  { emoji: "⚙️", label: "Настройки", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/20 flex items-center justify-center mx-auto mb-3 text-2xl">
            🦷
          </div>
          <p className="text-slate-400">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 w-64 bg-dark-800 border-r border-white/8 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-lg">
              🦷
            </div>
            <span className="text-lg font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-blue/15 text-white border border-brand-blue/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
          >
            <LogOut size={16} />
            Изход
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-white/8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="font-heading font-bold text-white">
            Dent<span className="text-brand-blue">AI</span>
          </span>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
