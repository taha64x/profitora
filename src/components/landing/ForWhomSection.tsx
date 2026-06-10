import Link from 'next/link'
import ScrollReveal from './ScrollReveal'

const SEGMENTS = [
  { label: 'Hotels & Pensionen',         icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4' },
  { label: 'Gastronomie & Restaurants',  icon: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7' },
  { label: 'Handwerksbetriebe',          icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { label: 'Einzelhandel',               icon: 'M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  { label: 'Online-Shops',               icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Dienstleister & Agenturen',  icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Arztpraxen & Therapeuten',   icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { label: 'Immobilienunternehmen',      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Familienbetriebe',           icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'KMU mit manuellen Abläufen', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Fitness & Wellness',         icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'Kosmetik & Beauty',          icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
]

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
    <section className="bg-gray-50 py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* For whom */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-hotel-navy text-sm font-semibold tracking-widest uppercase mb-3">
              Zielgruppe
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Für wen ist das geeignet?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Für kleine und mittelständische Unternehmen, die klare Antworten zu
              Kosten, Effizienz und Einsparmöglichkeiten suchen.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-20">
          {SEGMENTS.map((s, i) => (
            <ScrollReveal key={s.label} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-hotel-navy/25 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1a2744" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d={s.icon}/>
                  </svg>
                </div>
                <span className="text-gray-800 text-sm font-medium leading-tight">{s.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Why */}
        <ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-hotel-navy text-sm font-semibold tracking-widest uppercase mb-3">
                Warum nutzen Unternehmen die Analyse?
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
                Klarheit statt Komplexität
              </h3>
              <ul className="space-y-3">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-hotel-navy/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="#1a2744" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <p className="text-gray-900 font-bold text-lg mb-2">
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
                    <div className="w-1.5 h-1.5 rounded-full bg-au-gold flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
              <Link
                href="/analyze"
                className="flex items-center justify-center gap-2 bg-hotel-navy text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-hotel-navy-light transition-colors w-full"
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
