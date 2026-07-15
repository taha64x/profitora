import Link from 'next/link'

/**
 * Geführter Einstieg für frische Accounts — verschwindet automatisch,
 * sobald alle vier Schritte erledigt sind.
 */
interface Props {
  hasRevenue: boolean
  hasExpense: boolean
  hasEmployee: boolean
  hasReport: boolean
}

export default function FirstSteps({ hasRevenue, hasExpense, hasEmployee, hasReport }: Props) {
  const steps = [
    { done: hasRevenue, href: '/dashboard/revenues', label: 'Erste Einnahme erfassen', desc: 'Umsatz eintragen oder per CSV importieren' },
    { done: hasExpense, href: '/dashboard/costs', label: 'Erste Ausgabe erfassen', desc: 'Miete, Personal, Einkauf — mit Kategorie und Bereich' },
    { done: hasEmployee, href: '/dashboard/team', label: 'Team anlegen', desc: 'Mitarbeiter mit Lohn — Basis für Schichtplan und Personalquote' },
    { done: hasReport, href: '/dashboard/new-analysis', label: 'Erste KI-Analyse starten', desc: 'Sparpotenziale in Euro, mit Branchen-Benchmarks' },
  ]
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-sm">Erste Schritte</h2>
        <span className="text-xs text-gray-400">{doneCount} von {steps.length} erledigt</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full bg-au-gold transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {steps.map((step) => (
          <Link key={step.href} href={step.href}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${step.done ? 'opacity-50' : 'hover:bg-gray-50'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.done ? 'bg-green-100' : 'border-2 border-gray-200'}`}>
              {step.done && (
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{step.label}</p>
              <p className="text-xs text-gray-400">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
