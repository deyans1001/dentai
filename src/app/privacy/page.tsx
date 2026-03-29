export default function PrivacyPage() {
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
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Политика за поверителност</h1>
          <p className="text-slate-500 text-sm">Последна актуализация: 01.01.2025</p>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8 space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">1. Какви данни събираме</h2>
            <p>DentAI събира следните видове лични данни при регистрация и използване на платформата:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li>Имена и контактна информация на собственика на клиниката</li>
              <li>Данни на клиниката (адрес, работно време, услуги)</li>
              <li>Данни за персонала (имена, роли, работни часове)</li>
              <li>Данни за записани часове на пациенти (само тези, въведени в системата)</li>
              <li>Лог данни от AI разговори и телефонни обаждания</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">2. Как използваме данните</h2>
            <p>Събраните данни се използват за:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li>Предоставяне на AI рецепционист услугата</li>
              <li>Записване на часове и изпращане на потвърждения</li>
              <li>Подобряване на точността на AI модела</li>
              <li>Изпращане на фактури и известия за абонамента</li>
              <li>Техническа поддръжка</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">3. Съхранение на данни</h2>
            <p>
              Всички данни се съхраняват в криптирана база данни (Supabase) на сървъри в Европейския съюз.
              Данните за пациенти се пазят за срок от 3 години след последната активност, освен ако не поискате
              по-ранно изтриване.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">4. Споделяне с трети страни</h2>
            <p>Не продаваме и не предоставяме лични данни на трети страни, с изключение на:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Anthropic</strong> — за обработка на AI заявки (анонимизирани)</li>
              <li><strong className="text-slate-300">Stripe</strong> — за обработка на плащания</li>
              <li><strong className="text-slate-300">Retell AI</strong> — за телефонни обаждания</li>
              <li>При законово задължение от страна на компетентни органи</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">5. Вашите права</h2>
            <p>Имате право да:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-slate-400">
              <li>Получите копие на данните си</li>
              <li>Поискате поправка на неточни данни</li>
              <li>Поискате изтриване на данните си</li>
              <li>Се противопоставите на обработката за маркетингови цели</li>
              <li>Подадете жалба до КЗЛД (Комисия за защита на личните данни)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">6. Контакт</h2>
            <p>
              За въпроси относно поверителността, пишете ни на{" "}
              <a href="mailto:privacy@dentai.bg" className="text-brand-blue hover:text-blue-400">
                privacy@dentai.bg
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
