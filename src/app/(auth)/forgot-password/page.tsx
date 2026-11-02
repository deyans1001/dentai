"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error("[forgot-password]", resetError.message);
        setError("Не успяхме да изпратим имейла. Моля, опитайте отново след малко.");
        return;
      }

      setSent(true);
    } catch {
      setError("Неочаквана грешка. Моля, опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

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
          <p className="text-slate-400 mt-3">Възстановяване на парола</p>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
          <h1 className="text-2xl font-heading font-bold text-white mb-6 text-center">Забравена парола</h1>

          {sent ? (
            <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              Ако имейлът е регистриран, ще получите линк за смяна на паролата. Проверете и папка „Спам“.
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Имейл адрес</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="clinic@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Изпращане..." : "Изпрати линк"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            <a href="/login" className="text-brand-blue hover:text-blue-400 font-medium">
              ← Обратно към вход
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
