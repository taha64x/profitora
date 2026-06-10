import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

const TYPES = [
  {
    num: '01',
    title: 'Kostenanalyse',
    desc: 'Erkennt unnötige Ausgaben, teure Fixkosten, wiederkehrende Zahlungen und beziffert mögliche Einsparpotenziale – aufgeteilt nach Kostenbereichen.',
    points: ['Fixkosten & variable Kosten', 'Kosten pro Mitarbeiter / Abteilung', 'Ungenutzte Abos & Verträge'],
    accent: '#C9A84C',
  },
  {
    num: '02',
    title: 'Mitarbeiteranalyse',
    desc: 'Prüft Aufgaben, Arbeitszeiten und Personalkosten. Zeigt, ob Aufgaben besser verteilt werden können und wo Überstunden oder Leerlauf entstehen.',
    points: ['Kosten-Nutzen je Rolle', 'Aufgabenverteilung prüfen', 'Überstunden & Leerlauf erkennen'],
    accent: '#6B8CFF',
  },
  {
    num: '03',
    title: 'Buchhaltungsanalyse',
    desc: 'Analysiert Einnahmen, Ausgaben, Margen und Zahlungsflüsse. Erkennt Auffälligkeiten, offene Forderungen und ermöglicht Monatsvergleiche.',
    points: ['Umsatz, Gewinn & Marge', 'Wiederkehrende Kosten', 'Auffälligkeiten in Tabellen'],
    accent: '#4CAF8C',
  },
  {
    num: '04',
    title: 'Prozessanalyse',
    desc: 'Findet manuelle Arbeitsschritte, Zeitverluste und Doppelarbeit. Schlägt Automatisierungsmöglichkeiten und bessere Abläufe vor.',
    points: ['Manuelle Aufgaben identifizieren', 'Zeitersparnis schätzen', 'Digitalisierungsvorschläge'],
    accent: '#E07C4A',
  },
  {
    num: '05',
    title: 'Branchenvergleich',
    desc: 'Vergleicht Ihre Kennzahlen mit branchentypischen Werten und aktuellen Marktdaten. Zeigt, wo Ihr Betrieb über- oder unterdurchschnittlich abschneidet.',
    points: ['Benchmarkvergleich mit Branche', 'Öffentliche Quellen mit Datum', 'Kosten- & Effizienzposition'],
    accent: '#A854F7',
  },
  {
    num: '06',
    title: 'Komplettanalyse',
    desc: 'Kombiniert alle fünf Module zu einem vollständigen Optimierungsbericht mit Prioritätenplan, konkreten Maßnahmen und geschätztem Einspareffekt.',
    points: ['Alle Module kombiniert', 'Prioritätenplan (30/60/90 Tage)', 'Geschätzter finanzieller Effekt'],
    accent: '#C9A84C',
  },
]

export default function AnalysisTypesSection() {
  return (
    <section id="analysearten" className="bg-[#06091A] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-au-gold text-sm font-semibold tracking-widest uppercase mb-3">
              Analysearten
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Welche Analysen sind möglich?
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base leading-relaxed">
              Wählen Sie eine einzelne Analyse oder kombinieren Sie mehrere Module
              zur vollständigen betriebswirtschaftlichen Unternehmensanalyse.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TYPES.map((t, i) => (
            <ScrollReveal key={t.num} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="bento-card p-7 h-full flex flex-col group">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="text-3xl font-black leading-none select-none"
                    style={{ color: t.accent + '30' }}
                  >
                    {t.num}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2"
                    style={{ backgroundColor: t.accent }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-3 transition-colors"
                  style={{ color: t.accent }}
                >
                  {t.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed mb-5 flex-1">
                  {t.desc}
                </p>
                <ul className="space-y-1.5">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-white/30 text-xs">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="text-center mt-10">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-au-gold hover:bg-au-gold-light text-[#06091A] font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              Analyse konfigurieren
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
