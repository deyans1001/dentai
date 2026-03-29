"use client";

export default function ContactPage() {
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

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="text-white font-semibold mb-1">Имейл</h3>
            <a href="mailto:info@dentai.bg" className="text-brand-blue hover:text-blue-400 text-sm">
              info@dentai.bg
            </a>
            <p className="text-slate-500 text-xs mt-1">Отговаряме до 24 часа</p>
          </div>

          <div className="bg-dark-800 border border-white/8 rounded-2xl p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-white font-semibold mb-1">Поддръжка</h3>
            <a href="mailto:support@dentai.bg" className="text-brand-blue hover:text-blue-400 text-sm">
              support@dentai.bg
            </a>
            <p className="text-slate-500 text-xs mt-1">Технически въпроси</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8">
          <h2 className="text-xl font-heading font-bold text-white mb-6">Изпратете съобщение</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Вашето име</label>
                <input
                  type="text"
                  placeholder="Д-р Иван Иванов"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Имейл</label>
                <input
                  type="email"
                  placeholder="clinic@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Тема</label>
              <input
                type="text"
                placeholder="Въпрос за плановете"
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Съобщение</label>
              <textarea
                rows={5}
                placeholder="Разкажете ни как можем да помогнем..."
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-brand-blue transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold transition-all"
            >
              Изпратете съобщение
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-slate-500 text-sm hover:text-slate-400 transition-colors">
            ← Обратно към началото
          </a>
        </div>
      </div>
    </div>
  );
}
