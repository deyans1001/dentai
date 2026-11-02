"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Линкът от имейла носи ?code=... — разменяме го за сесия, за да може да сменим паролата.
  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    async function init() {
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) console.error("[reset-password] exchange", exchangeError.message);
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
        } else {
          setError("Линкът е невалиден или е изтекъл. Моля, заявете нов.");
        }
      } catch {
        setError("Линкът е невалиден или е изтекъл. Моля, заявете нов.");
      }
    }

    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Паролата трябва да е поне 6 символа.");
      return;
    }
    if (password !== confirm) {
      setError("Паролите не съвпадат.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error("[reset-password] update", updateError.message);
        setError("Не успяхме да сменим паролата. Моля, опитайте отново.");
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors";

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-2xl">
              🦷
            </div>
            <span className="text-2xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <p className="text-slate-400 mt-3">Изберете нова парола</p>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
          <h1 className="text-2xl font-heading font-bold text-white mb-6 text-center">Нова парола</h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Нова парола</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Повторете паролата</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Запазване..." : "Запази паролата"}
              </button>
            </form>
          ) : (
            !error && <p className="text-center text-slate-400 text-sm">Проверка на линка...</p>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            <a href={error ? "/forgot-password" : "/login"} className="text-brand-blue hover:text-blue-400 font-medium">
              {error ? "Заяви нов линк" : "← Обратно към вход"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
