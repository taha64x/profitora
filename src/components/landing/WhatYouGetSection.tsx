import ScrollReveal from './ScrollReveal'

const REPORT_SECTIONS = [
  { num: '01', title: 'Executive Summary',          desc: 'Übersicht der wichtigsten Erkenntnisse und Prioritäten auf einen Blick.' },
  { num: '02', title: 'Unternehmensüberblick',       desc: 'Einordnung der Betriebssituation, Branche und verfügbarer Datenbasis.' },
  { num: '03', title: 'Erkannte Kostenstruktur',     desc: 'Vollständige Aufschlüsselung aller erkannten Kosten nach Kategorien.' },
  { num: '04', title: 'Einnahmen- & Margenanalyse',  desc: 'Umsatz, Gewinn, Rohertragsmarge, saisonale Schwankungen und Hauptquellen.' },
  { num: '05', title: 'Mitarbeiteranalyse',          desc: 'Personalkosten, Aufgabenverteilung, Produktivität und Optimierungsansätze.' },
  { num: '06', title: 'Prozessanalyse',              desc: 'Manuelle Prozesse, Automatisierungspotenzial und Zeitersparnis-Schätzungen.' },
  { num: '07', title: 'Branchenvergleich',           desc: 'Positionierung gegenüber branchentypischen Kennzahlen mit Quellenangaben.' },
  { num: '08', title: 'Auffälligkeiten & Risiken',   desc: 'Ungewöhnliche Kostenmuster, Risikobereiche und Handlungsdringlichkeit.' },
  { num: '09', title: 'Einsparpotenziale',           desc: 'Geschätzte Einsparpotenziale je Bereich – als Schätzung mit Datenbasis.' },
  { num: '10', title: 'Handlungsempfehlungen',       desc: 'Konkrete, nummerierte Maßnahmen – begründet mit Zahlen aus der Analyse.' },
  { num: '11', title: '30 / 60 / 90-Tage-Plan',     desc: 'Sofortmaßnahmen, kurzfristige Ziele und mittelfristiger Umsetzungsplan.' },
  { num: '12', title: 'Offene Fragen & Disclaimer',  desc: 'Fehlende Daten, Einschränkungen und rechtliche Abgrenzung der Analyse.' },
]

const BADGES = [
  'Zusammenfassung',
  'Wichtigste Kostenprobleme',
  'Einsparpotenziale in EUR',
  'Mitarbeiter- & Aufgabenanalyse',
  'Branchenvergleich',
  'Risikohinweise',
  'Konkrete Maßnahmen',
  'Prioritätenliste',
  'Geschätzte Einsparung/Monat',
  'Sofortmaßnahmen',
  '30 / 60 / 90-Tage-Plan',
  'Automatisierungsvorschläge',
]

export default function WhatYouGetSection() {
  return (
    <section className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
              Der Analysebericht
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
              Was Sie am Ende erhalten
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Ein strukturierter Bericht in bis zu 12 Abschnitten – verständlich formuliert,
              mit konkreten Zahlen und klaren Handlungsempfehlungen.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-14">
          {REPORT_SECTIONS.map((s, i) => (
            <ScrollReveal key={s.num} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-hotel-navy/20 hover:bg-gray-50 transition-all group h-full">
                <span className="text-xs font-black text-gray-200 group-hover:text-hotel-navy/30 transition-colors mt-0.5 leading-none w-8 flex-shrink-0">
                  {s.num}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{s.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Badge overview */}
        <ScrollReveal>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            <p className="text-gray-400 text-xs uppercase tracking-widest font-medium text-center mb-5">
              Enthaltene Elemente
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-au-gold" />
                  {b}
                </span>
              ))}
            </div>
            <p className="text-center text-gray-400 text-xs mt-5 leading-relaxed max-w-lg mx-auto">
              Alle geschätzten Einsparpotenziale sind als Schätzungen gekennzeichnet und basieren auf
              den bereitgestellten Daten. Keine Garantien – abhängig von Umsetzung und Einzelfall.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
