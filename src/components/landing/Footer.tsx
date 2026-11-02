export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-xl">
                🦷
              </div>
              <span className="text-xl font-heading font-bold text-white">
                Dent<span className="text-brand-blue">AI</span>
              </span>
            </a>
            <p className="text-slate-500 text-sm leading-relaxed">
              AI рецепционист за дентални клиники в България. Отговаря 24/7, записва часове автоматично.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Бързи връзки</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <a href="/#pricing" className="hover:text-slate-300 transition-colors">Ценообразуване</a>
              <a href="/blog" className="hover:text-slate-300 transition-colors">Блог</a>
              <a href="/contact" className="hover:text-slate-300 transition-colors">Контакти</a>
              <a href="/register" className="hover:text-slate-300 transition-colors">Регистрация</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Контакт</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <a href="tel:+359897037079" className="hover:text-slate-300 transition-colors flex items-center gap-2">
                📞 089 703 7079
              </a>
              <a href="mailto:teamsupportdentai@gmail.com" className="hover:text-slate-300 transition-colors flex items-center gap-2">
                ✉️ teamsupportdentai@gmail.com
              </a>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/dentai.bg/" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-dark-700 border border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-400/30 transition-all text-xs font-bold">
                f
              </a>
              <a href="https://www.instagram.com/dentai.bg/" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-dark-700 border border-white/10 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-400/30 transition-all text-xs font-bold">
                ig
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-sm">
            © 2025 DentAI · Всички права запазени
          </p>
          <div className="flex gap-4 text-xs text-slate-600">
            <a href="/terms" className="hover:text-slate-400 transition-colors">Условия</a>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Поверителност</a>
            <a href="/gdpr" className="hover:text-slate-400 transition-colors">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
