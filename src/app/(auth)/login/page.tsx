"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http") &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_url");

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Демо режим — добавете Supabase конфигурация в .env.local за реален вход.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Грешен имейл или парола. Моля, опитайте отново.");
        } else {
          setError("Грешка при вход. Моля, опитайте отново.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Неочаквана грешка. Моля, опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-2xl">
              🦷
            </div>
            <span className="text-2xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <p className="text-slate-400 mt-3">Влезте в своя акаунт</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
          <h1 className="text-2xl font-heading font-bold text-white mb-6 text-center">Вход</h1>

          {!isSupabaseConfigured && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Демо режим — добавете Supabase конфигурация в <code className="font-mono">.env.local</code> за реален вход.
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Имейл адрес
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="clinic@example.com"
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Парола
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-sm text-brand-blue hover:text-blue-400">
                Забравена парола?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Влизане..." : "Вход"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Нямате акаунт?{" "}
            <a href="/register" className="text-brand-blue hover:text-blue-400 font-medium">
              Регистрирайте се безплатно
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
