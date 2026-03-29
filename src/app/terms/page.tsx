export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-900 px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <a href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-xl">
              🦷
            </div>
            <span className="text-xl font-heading font-bold text-white">
              Dent<span className="text-brand-blue">AI</span>
            </span>
          </a>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Условия за ползване</h1>
          <p className="text-slate-500 text-sm">Последна актуализация: 01.01.2025</p>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8 space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">1. Приемане на условията</h2>
            <p>
              С използването на платформата DentAI вие приемате настоящите Условия за ползване.
              Ако не сте съгласни, моля, не използвайте услугата.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">2. Описание на услугата</h2>
            <p>
              DentAI предоставя AI-базиран рецепционист за дентални клиники в България, включващ:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li>Автоматично записване на часове чрез чат и телефон</li>
              <li>AI асистент на живо за отговаряне на пациентски въпроси</li>
              <li>Интеграция с Google Calendar</li>
              <li>Анализ и статистика за клиниката</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">3. Абонаменти и плащане</h2>
            <p>
              DentAI работи на абонаментен модел. Пробният период е 9 дни и е безплатен.
              След изтичане на пробния период, абонаментът се подновява автоматично.
              Можете да анулирате по всяко време от настройките на акаунта.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">4. Отговорности на потребителя</h2>
            <p>Вие се задължавате да:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li>Предоставяте точна и вярна информация за клиниката</li>
              <li>Спазвате действащото законодателство при обработка на данни на пациенти</li>
              <li>Не злоупотребявате с AI системата за незаконни цели</li>
              <li>Пазите конфиденциалността на своите данни за вход</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">5. Ограничение на отговорността</h2>
            <p>
              DentAI е инструмент за подпомагане на работата на рецепцията. Крайната отговорност
              за медицинските решения и работата с пациенти остава изцяло при клиниката.
              DentAI не носи отговорност за грешки при записани часове, причинени от невярна
              информация, предоставена от клиниката.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">6. Прекратяване</h2>
            <p>
              DentAI си запазва правото да прекрати достъпа до услугата при нарушение на
              настоящите условия. При прекратяване, вашите данни се запазват 30 дни, след което
              се изтриват необратимо.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">7. Приложимо право</h2>
            <p>
              Настоящите условия се управляват от законодателството на Република България.
              Всякакви спорове се разрешават от компетентните съдилища в гр. София.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">8. Контакт</h2>
            <p>
              При въпроси:{" "}
              <a href="mailto:legal@dentai.bg" className="text-brand-blue hover:text-blue-400">
                legal@dentai.bg
              </a>
            </p>
          </section>
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
