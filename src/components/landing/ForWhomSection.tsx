import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

const REASONS = [
  'Unklare Kostenstruktur und fehlende Übersicht über alle Ausgaben',
  'Zu viel Zeit für manuelle Prüfung statt strategische Entscheidungen',
  'Keine schnelle Möglichkeit, Einsparpotenziale zu identifizieren',
  'Berichte und Tabellen sind zu komplex für den Alltag',
  'Mitarbeiterkosten steigen, aber Produktivität ist schwer messbar',
  'Branchenvergleich fehlt – unklar, ob Kosten normal oder zu hoch sind',
]

export default function ForWhomSection() {
  return (
    <section className="bg-gradient-to-b from-white via-gray-100 to-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
              Zielgruppe
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
              Für wen ist das geeignet?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Für kleine und mittelständische Unternehmen, die klare Antworten zu
              Kosten, Effizienz und Einsparmöglichkeiten suchen.
            </p>
          </div>
        </ScrollReveal>

        {/* Why */}
        <ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h3 className="font-display text-2xl font-bold text-[#0E1A33] mb-6 leading-snug">
                Klarheit statt Komplexität
              </h3>
              <ul className="space-y-3">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0E1A33]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="#0E1A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <p className="font-display text-[#0E1A33] font-bold text-lg mb-2">
                Datenbasiert statt bauchgefühlbasiert
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Die Analyse hilft, mögliche Einsparpotenziale sichtbar zu machen – basierend auf
                echten Unternehmensdaten und aktuellen Branchenwerten. Keine Versprechen,
                keine Garantien. Strukturierte Entscheidungshilfe.
              </p>
              <div className="border-t border-gray-100 pt-5 space-y-2 mb-6">
                {[
                  'Orientiert an Methoden aus Controlling & Kostenrechnung',
                  'Branchenspezifische Benchmarks und Richtwerte',
                  'Verständlicher Bericht statt komplizierter Tabellen',
                  'Alle Schätzungen als solche gekennzeichnet',
                ].map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
              <Link
                href="/analyze"
                className="flex items-center justify-center gap-2 bg-[#0E1A33] text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-[#1a2744] transition-colors w-full"
              >
                Analyse starten
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
