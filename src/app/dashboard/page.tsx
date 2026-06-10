import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

const EXPENSE_CATEGORIES = ['Personal', 'Miete', 'Energie', 'Software', 'Marketing', 'Einkauf', 'Fahrzeuge', 'Versicherungen', 'Steuern/Buchh.', 'Sonstiges']

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function StatCard({
  label, value, sub, color = 'blue', icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: string
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    gold:   'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d={icon}/>
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((amount / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600 text-xs">{label}</span>
        <span className="text-gray-900 text-xs font-semibold">{formatEur(amount)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
    include: { organization: true },
  })
  if (!membership) redirect('/onboarding')

  const org = membership.organization
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [expenses, revenues, reports, subscription] = await Promise.all([
    db.expense.findMany({ where: { organizationId: org.id, date: { gte: monthStart, lte: monthEnd } }, orderBy: { date: 'desc' }, take: 5 }),
    db.revenue.findMany({ where: { organizationId: org.id, date: { gte: monthStart, lte: monthEnd } }, orderBy: { date: 'desc' }, take: 5 }),
    db.analysisReport.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: 'desc' }, take: 4 }),
    db.subscription.findUnique({ where: { organizationId: org.id } }),
  ])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0)
  const profit = totalRevenues - totalExpenses

  // Category breakdown
  const catMap: Record<string, number> = {}
  expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCats[0]?.[1] ?? 1

  const planLabel: Record<string, string> = { free: 'Free', schnellcheck: 'Schnellcheck', standard: 'Standard', tiefenanalyse: 'Tiefenanalyse', komplett: 'Komplett' }
  const plan = subscription?.planName ?? 'free'
  const usedAnalyses = subscription?.usedAnalysesThisMonth ?? 0
  const limitAnalyses = subscription?.monthlyAnalysisLimit ?? 1

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guten Morgen 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {org.name} · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link href="/dashboard/new-analysis"
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Neue Analyse
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Paket" value={planLabel[plan] ?? plan} sub={`${usedAnalyses} / ${limitAnalyses} Analysen`} color="gold"
            icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          <StatCard label="Einnahmen (Monat)" value={formatEur(totalRevenues)} sub="aktueller Monat" color="green"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <StatCard label="Ausgaben (Monat)" value={formatEur(totalExpenses)} sub="aktueller Monat" color="red"
            icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          <StatCard label="Geschätzter Gewinn" value={formatEur(profit)} sub="Einnahmen − Ausgaben" color={profit >= 0 ? 'green' : 'red'}
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Cost breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-sm">Top Kostenbereiche</h2>
              <Link href="/dashboard/costs" className="text-xs text-[#0D1630] hover:underline">Alle →</Link>
            </div>
            {topCats.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Noch keine Kosten eingetragen.</p>
                <Link href="/dashboard/costs" className="text-xs text-[#0D1630] hover:underline mt-2 block">Kosten hinzufügen</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topCats.map(([cat, amt]) => (
                  <MiniBar key={cat} label={cat} amount={amt} max={maxCat}
                    color="bg-red-400"/>
                ))}
              </div>
            )}
          </div>

          {/* Revenue breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-sm">Einnahmequellen</h2>
              <Link href="/dashboard/revenues" className="text-xs text-[#0D1630] hover:underline">Alle →</Link>
            </div>
            {revenues.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Noch keine Einnahmen eingetragen.</p>
                <Link href="/dashboard/revenues" className="text-xs text-[#0D1630] hover:underline mt-2 block">Einnahmen hinzufügen</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const revCats: Record<string, number> = {}
                  revenues.forEach((r) => { revCats[r.category] = (revCats[r.category] || 0) + r.amount })
                  const top = Object.entries(revCats).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  const max = top[0]?.[1] ?? 1
                  return top.map(([cat, amt]) => (
                    <MiniBar key={cat} label={cat} amount={amt} max={max} color="bg-green-400"/>
                  ))
                })()}
              </div>
            )}
          </div>

          {/* KI Hinweise */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-5 h-5 rounded-full bg-au-gold/15 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-au-gold" />
              </div>
              <h2 className="font-semibold text-gray-900 text-sm">KI-Hinweise</h2>
            </div>
            <div className="space-y-3">
              {totalExpenses === 0 && totalRevenues === 0 ? (
                <p className="text-gray-400 text-sm">Tragen Sie Kosten und Einnahmen ein, um automatische Hinweise zu erhalten.</p>
              ) : (
                <>
                  {totalExpenses > 0 && totalRevenues > 0 && (
                    <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <p className="text-amber-800 text-xs leading-relaxed">
                        Personalkosten machen{' '}
                        <strong>{totalRevenues > 0 ? Math.round((totalExpenses / totalRevenues) * 100) : 0} %</strong>{' '}
                        des Umsatzes aus. Starten Sie eine Analyse für Details.
                      </p>
                    </div>
                  )}
                  {profit < 0 && (
                    <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-red-800 text-xs leading-relaxed">
                        Ausgaben übersteigen Einnahmen. Eine Kostenanalyse könnte helfen.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <p className="text-blue-800 text-xs leading-relaxed">
                      Für tiefere Einblicke starten Sie eine KI-Analyse auf Basis Ihrer gespeicherten Daten.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Recent reports + Recent expenses */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent reports */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-sm">Letzte Analysen</h2>
              <Link href="/dashboard/analyses" className="text-xs text-[#0D1630] hover:underline">Alle →</Link>
            </div>
            {reports.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">Noch keine Analysen gestartet.</p>
                <Link href="/dashboard/new-analysis"
                  className="inline-flex items-center gap-1.5 bg-[#0D1630] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#152040] transition-colors">
                  Erste Analyse starten
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Link key={r.id} href={`/report/${r.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('de-DE')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      r.status === 'FAILED'    ? 'bg-red-100 text-red-700' :
                                                 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status === 'COMPLETED' ? 'Fertig' : r.status === 'FAILED' ? 'Fehler' : 'In Arbeit'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Next steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-5">Empfohlene nächste Schritte</h2>
            <div className="space-y-3">
              {[
                { href: '/dashboard/costs',    label: 'Kosten diesen Monat eintragen', done: expenses.length > 0,
                  desc: 'Fixkosten, variable Kosten und Ausgaben erfassen' },
                { href: '/dashboard/revenues', label: 'Einnahmen diesen Monat eintragen', done: revenues.length > 0,
                  desc: 'Umsatz und Einnahmequellen dokumentieren' },
                { href: '/dashboard/new-analysis', label: 'Erste Analyse starten', done: reports.length > 0,
                  desc: 'KI analysiert Kosten, Einnahmen und Prozesse' },
                { href: '/dashboard/finance',  label: 'Finanzübersicht ansehen', done: false,
                  desc: 'Überblick über Kostenfluss und Gewinn' },
              ].map((step) => (
                <Link key={step.href} href={step.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-[#0D1630]/10'}`}>
                    {step.done ? (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M5 2l4 4-4 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 truncate">{step.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
