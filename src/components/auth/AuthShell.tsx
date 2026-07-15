import Link from 'next/link'

/**
 * Split-Layout für alle Auth-Seiten: links Marken-Panel (Desktop),
 * rechts das Formular. Mobile: nur Formular mit Logo-Kopf.
 */
interface Props {
  children: React.ReactNode
  /** Ersetzt die Standard-Vorteile im Panel (z. B. Tarif-Zusammenfassung im Register) */
  panel?: React.ReactNode
}

const DEFAULT_BENEFITS = [
  { title: 'Alle Zahlen an einem Ort', desc: 'Einnahmen, Ausgaben, Team und Schichtplan im Cockpit' },
  { title: 'KI-Analyse mit Branchen-Benchmarks', desc: 'Sparpotenziale in Euro, geprüft nach Prüfer-Methodik' },
  { title: 'In 2 Minuten startklar', desc: '14 Tage kostenlos testen, monatlich kündbar' },
]

export default function AuthShell({ children, panel }: Props) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Marken-Panel */}
      <div className="hidden lg:flex w-[44%] max-w-xl bg-gradient-to-br from-[#0A1226] via-[#0E1A33] to-[#1A2A52] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Logo-Motiv als stilles Wasserzeichen */}
        <svg viewBox="0 0 16 16" fill="none" className="absolute -bottom-40 -right-40 w-[560px] h-[560px] opacity-[0.06] pointer-events-none" aria-hidden>
          <path d="M8 2L14 13H2L8 2Z" fill="#C9A84C"/>
        </svg>

        <Link href="/" className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5"><path d="M8 2L14 13H2L8 2Z" fill="#06091A"/></svg>
          </div>
          <span className="font-bold text-xl tracking-tight">Profitora</span>
        </Link>

        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight leading-snug mb-8">
            Ihr Unternehmen.<br/>Ein Cockpit.<br/>
            <span className="text-au-gold">Klare Zahlen.</span>
          </h1>
          {panel ?? (
            <ul className="space-y-5">
              {DEFAULT_BENEFITS.map((b) => (
                <li key={b.title} className="flex gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-au-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-white/35 text-xs relative">
          DSGVO-konform · Daten in Frankfurt (EU) · Kündigung jederzeit im Konto
        </p>
      </div>

      {/* Formular-Spalte */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Mobile-Logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-4.5 h-4.5" width="18" height="18"><path d="M8 2L14 13H2L8 2Z" fill="#06091A"/></svg>
          </div>
          <span className="font-bold text-xl text-[#0E1A33] tracking-tight">Profitora</span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
