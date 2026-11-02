"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          to: "teamsupportdentai@gmail.com",
          ...form,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
    } catch {
      setError("Съобщението не беше изпратено. Моля, опитайте отново или ни пишете на teamsupportdentai@gmail.com.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <a href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-xl">
              🦷
            </div>
            <span className="text-xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Свържете се с нас</h1>
          <p className="text-slate-400">Екипът ни е тук, за да Ви помогне</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-dark-800 border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-2">📞</div>
            <h3 className="text-white font-semibold text-sm mb-1">Телефон</h3>
            <a href="tel:+359897037079" className="text-brand-blue hover:text-blue-400 text-sm font-medium">
              089 703 7079
            </a>
            <p className="text-slate-500 text-xs mt-1">Пон–Пет 9:00–18:00</p>
          </div>

          <div className="bg-dark-800 border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-2">✉️</div>
            <h3 className="text-white font-semibold text-sm mb-1">Имейл</h3>
            <a href="mailto:teamsupportdentai@gmail.com" className="text-brand-blue hover:text-blue-400 text-sm break-all">
              teamsupportdentai@gmail.com
            </a>
            <p className="text-slate-500 text-xs mt-1">Отговаряме до 24ч</p>
          </div>

          <div className="bg-dark-800 border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="text-white font-semibold text-sm mb-1">Онлайн демо</h3>
            <a href="/register" className="text-brand-green hover:text-green-400 text-sm font-medium">
              Безплатен пробен период
            </a>
            <p className="text-slate-500 text-xs mt-1">14 дни без карта</p>
          </div>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-white font-bold text-xl mb-2">Съобщението е изпратено!</h2>
            <p className="text-slate-400">Ще се свържем с Вас до 24 часа.</p>
            <a href="/" className="inline-block mt-5 text-brand-blue hover:text-blue-400 text-sm">← Обратно към началото</a>
          </div>
        ) : (
          <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
            <h2 className="text-xl font-heading font-bold text-white mb-6">Изпратете съобщение</h2>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Вашето име</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Д-р Иван Иванов"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Имейл</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="clinic@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Тема</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Въпрос за плановете"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Съобщение</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Разкажете ни как можем да помогнем..."
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 disabled:opacity-50 text-white font-semibold transition-all"
              >
                {loading ? "Изпраща се..." : "Изпратете съобщение"}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-8">
          <a href="/" className="text-slate-500 text-sm hover:text-slate-400 transition-colors">
            ← Обратно към началото
          </a>
        </div>
      </div>
    </div>
  );
}
