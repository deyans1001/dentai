export default function GdprPage() {
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
          <h1 className="text-4xl font-heading font-bold text-white mb-4">GDPR Информация</h1>
          <p className="text-slate-500 text-sm">Съответствие с Регламент (ЕС) 2016/679</p>
        </div>

        <div className="bg-dark-800 border border-white/8 rounded-2xl p-8 space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">Администратор на данни</h2>
            <div className="bg-dark-700 rounded-xl p-4 border border-white/5 text-sm text-slate-400 space-y-1">
              <p><strong className="text-slate-300">Дружество:</strong> DentAI Ltd.</p>
              <p><strong className="text-slate-300">Имейл:</strong> <a href="mailto:dpo@dentai.bg" className="text-brand-blue">dpo@dentai.bg</a></p>
              <p><strong className="text-slate-300">Длъжностно лице по защита на данните (DPO):</strong> На разположение при поискване</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">Правно основание за обработка</h2>
            <div className="space-y-3">
              {[
                { basis: "Изпълнение на договор (чл. 6(1)(б) GDPR)", desc: "Обработваме данни, необходими за предоставяне на AI рецепционист услугата." },
                { basis: "Законов интерес (чл. 6(1)(е) GDPR)", desc: "Обработваме статистически данни за подобряване на услугата." },
                { basis: "Съгласие (чл. 6(1)(а) GDPR)", desc: "За изпращане на маркетингови съобщения (може да бъде оттеглено по всяко време)." },
              ].map((item, i) => (
                <div key={i} className="bg-dark-700 rounded-xl p-4 border border-white/5">
                  <p className="text-white font-medium text-sm mb-1">{item.basis}</p>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">Срокове за съхранение</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="text-slate-300 pb-2 pr-4">Тип данни</th>
                    <th className="text-slate-300 pb-2">Срок на съхранение</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-white/5">
                  {[
                    ["Данни за акаунта", "До изтриване на акаунта + 30 дни"],
                    ["Данни за записи на часове", "3 години"],
                    ["Лог данни от обаждания", "12 месеца"],
                    ["Финансови документи", "10 години (по закон)"],
                    ["Маркетингови данни", "До оттегляне на съгласието"],
                  ].map(([type, period]) => (
                    <tr key={type}>
                      <td className="py-2.5 pr-4">{type}</td>
                      <td className="py-2.5">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">Вашите права по GDPR</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { right: "Право на достъп", desc: "Получете копие на всички данни, които пазим за вас" },
                { right: "Право на поправка", desc: "Поправете неточни или непълни данни" },
                { right: "Право на изтриване", desc: "Поискайте да изтрием вашите данни" },
                { right: "Право на ограничение", desc: "Ограничете обработката на вашите данни" },
                { right: "Право на преносимост", desc: "Получете данните си в машинночетим формат" },
                { right: "Право на възражение", desc: "Възразете срещу обработка за маркетинг" },
              ].map((item) => (
                <div key={item.right} className="bg-dark-700 rounded-xl p-4 border border-white/5">
                  <p className="text-white font-medium text-sm mb-1">{item.right}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-sm mt-4">
              За упражняване на правата си, пишете на{" "}
              <a href="mailto:dpo@dentai.bg" className="text-brand-blue hover:text-blue-400">dpo@dentai.bg</a>.
              Отговаряме до 30 дни.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-3">Жалби</h2>
            <p>
              Имате право да подадете жалба до{" "}
              <strong className="text-slate-200">Комисия за защита на личните данни (КЗЛД)</strong>:
            </p>
            <div className="bg-dark-700 rounded-xl p-4 border border-white/5 text-sm text-slate-400 mt-3 space-y-1">
              <p>Адрес: гр. София 1592, бул. „Проф. Цветан Лазаров" № 2</p>
              <p>Уебсайт: <a href="https://www.cpdp.bg" className="text-brand-blue" target="_blank" rel="noopener noreferrer">www.cpdp.bg</a></p>
              <p>Имейл: kzld@cpdp.bg</p>
            </div>
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
