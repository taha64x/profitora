import Link from 'next/link'
import AnalysisConfigurator from '@/components/analyze/AnalysisConfigurator'

interface PageProps {
  searchParams: { level?: string }
}

export const metadata = {
  title: 'Analyse konfigurieren – Profitora',
  description: 'Wählen Sie Branche, Analysearten, Datenquelle und Genauigkeitstiefe für Ihre individuelle Unternehmensanalyse.',
}

export default function AnalyzePage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-[#06091A] text-white">
      {/* Header */}
      <header className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M8 2L14 13H2L8 2Z" fill="#06091A"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight">Profitora</span>
        </Link>
        <Link href="/login" className="text-white/40 hover:text-white text-sm transition-colors">
          Anmelden
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Intro */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-au-gold/30 text-au-gold text-xs font-medium px-4 py-1.5 rounded-full mb-6 bg-au-gold/5">
            <div className="w-1.5 h-1.5 rounded-full bg-au-gold animate-pulse" />
            KI-gestützte betriebswirtschaftliche Analyse
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Analyse konfigurieren
          </h1>
          <p className="text-white/45 text-base max-w-lg mx-auto leading-relaxed">
            In 5 Schritten zur Analyse, die genau auf Ihr Unternehmen zugeschnitten ist.
            Branche, Analysearten, Datenquelle und Genauigkeit.
          </p>
        </div>

        {/* Freie Analyse – ohne Konfiguration direkt loslegen */}
        <Link
          href="/analyze/upload?industry=other&types=komplett&method=upload&level=standard&goals=alles_pruefen&free=1"
          className="group flex items-center justify-between gap-4 bg-au-gold/8 border border-au-gold/25 hover:border-au-gold/50 rounded-2xl p-6 mb-8 transition-all"
        >
          <div>
            <p className="font-bold text-white text-base mb-1 flex items-center gap-2">
              Freie Analyse – einfach Dokumente hochladen
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-au-gold text-[#06091A] px-2 py-0.5 rounded-full">
                Ohne Konfiguration
              </span>
            </p>
            <p className="text-white/45 text-sm leading-relaxed">
              Nichts einstellen: Laden Sie beliebige Unterlagen hoch (CSV, Excel, Rechnungen, Auswertungen) –
              die KI erkennt Branche und Struktur automatisch und erstellt eine Komplett-Analyse.
            </p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0 group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        {/* Configurator */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8">
          <AnalysisConfigurator defaultLevel={searchParams.level} />
        </div>

        {/* Input-method info cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            {
              title: 'Dokumente hochladen',
              desc: 'Buchhaltung, Tabellen, Rechnungen, Screenshots oder interne Auswertungen. Je mehr echte Daten, desto genauer die Analyse.',
              icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
            },
            {
              title: 'Fragebogen ausfüllen',
              desc: 'Keine Unterlagen? Kein Problem. Strukturierter Fragebogen in 7 Schritten – die KI erstellt daraus eine fundierte Analyse.',
              icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            },
            {
              title: 'Kombiniert (empfohlen)',
              desc: 'Für die genaueste Analyse: Dokumente hochladen und Fragebogen ergänzen. Echte Daten + Hintergrundinformationen verbinden.',
              icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
            },
          ].map((card) => (
            <div key={card.title} className="bg-white/[0.02] border border-white/6 rounded-xl p-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mb-3">
                <path d={card.icon}/>
              </svg>
              <p className="font-semibold text-white text-sm mb-1.5">{card.title}</p>
              <p className="text-white/35 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Legal */}
        <p className="text-white/20 text-xs text-center mt-8 leading-relaxed">
          Diese Analyse ist eine KI-gestützte betriebswirtschaftliche Entscheidungshilfe.
          Sie ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung.
        </p>
      </div>
    </div>
  )
}
