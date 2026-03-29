export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-xl">
              🦷
            </div>
            <span className="text-xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <a href="/terms" className="hover:text-slate-300 transition-colors">
              Условия за ползване
            </a>
            <a href="/privacy" className="hover:text-slate-300 transition-colors">
              Поверителност
            </a>
            <a href="/gdpr" className="hover:text-slate-300 transition-colors">
              GDPR
            </a>
            <a href="/contact" className="hover:text-slate-300 transition-colors">
              Контакти
            </a>
          </div>

          {/* Copyright */}
          <p className="text-slate-600 text-sm text-center">
            © 2025 DentAI · AI рецепционист за дентални клиники в България
            <br />
            <span className="text-xs">Всички права запазени</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
