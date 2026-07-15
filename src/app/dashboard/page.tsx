import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import FirstSteps from '@/components/dashboard/FirstSteps'
import KpiLight from '@/components/dashboard/KpiLight'
import OnDutyCard from '@/components/dashboard/OnDutyCard'
import TrendSparkline from '@/components/dashboard/TrendSparkline'
import { benchmarksFor, computeFinanceKpis, METRIC_LABELS, type MetricKey } from '@/lib/benchmarks'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

/** ±%-Vergleich zum Vormonat als Untertitel */
function trendSub(current: number, previous: number): string {
  if (previous <= 0) return 'aktueller Monat'
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return 'wie im Vormonat'
  return `${pct > 0 ? '+' : ''}${pct} % vs. Vormonat`
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

function MiniBar({ label, amount, max }: { label: string; amount: number; max: number }) {
  const pct = max > 0 ? Math.round((amount / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600 text-xs">{label}</span>
        <span className="text-gray-900 text-xs font-semibold">{formatEur(amount)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-red-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Progress({ label, current, target, invert = false }: { label: string; current: number; target: number; invert?: boolean }) {
  const pct = target > 0 ? Math.min(150, Math.round((current / target) * 100)) : 0
  // invert = Ausgaben: über Ziel ist schlecht
  const good = invert ? pct <= 100 : pct >= 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600 text-xs">{label}</span>
        <span className={`text-xs font-semibold ${good ? 'text-green-600' : 'text-gray-900'}`}>
          {formatEur(current)} / {formatEur(target)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${invert ? (pct > 100 ? 'bg-red-400' : 'bg-green-400') : pct >= 100 ? 'bg-green-400' : 'bg-[#0E1A33]'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
    include: { organization: true },
  })
  if (!membership) redirect('/onboarding')

  const org = membership.organization
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [expenseGroups, revenueAgg, prevExpenseAgg, prevRevenueAgg, target, alertEvents, reports, subscription] =
    await Promise.all([
      db.expense.groupBy({
        by: ['category'],
        where: { organizationId: org.id, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      db.revenue.aggregate({ where: { organizationId: org.id, date: { gte: monthStart } }, _sum: { amount: true } }),
      db.expense.aggregate({
        where: { organizationId: org.id, date: { gte: prevStart, lt: monthStart } },
        _sum: { amount: true },
      }),
      db.revenue.aggregate({
        where: { organizationId: org.id, date: { gte: prevStart, lt: monthStart } },
        _sum: { amount: true },
      }),
      db.monthlyTarget.findUnique({
        where: { organizationId_year_month: { organizationId: org.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
      }),
      db.alertEvent.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.analysisReport.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: 'desc' }, take: 4 }),
      db.subscription.findUnique({ where: { organizationId: org.id } }),
    ])

  // Für die Erste-Schritte-Karte: gibt es ÜBERHAUPT Daten (nicht nur im Monat)?
  const [anyRevenue, anyExpense, anyEmployee] = await Promise.all([
    db.revenue.count({ where: { organizationId: org.id }, take: 1 }),
    db.expense.count({ where: { organizationId: org.id }, take: 1 }),
    db.employee.count({ where: { organizationId: org.id }, take: 1 }),
  ])

  const expensesByCategory = Object.fromEntries(expenseGroups.map((g) => [g.category, g._sum.amount ?? 0]))
  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)
  const totalRevenues = revenueAgg._sum.amount ?? 0
  const prevExpenses = prevExpenseAgg._sum.amount ?? 0
  const prevRevenues = prevRevenueAgg._sum.amount ?? 0
  const profit = totalRevenues - totalExpenses
  const prevProfit = prevRevenues - prevExpenses

  const topCats = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCats[0]?.[1] ?? 1

  const credits = subscription?.analysisCredits ?? 0
  const usedAnalyses = subscription?.usedAnalysesThisMonth ?? 0

  const ent = getEntitlements(subscription)
  const cockpitLocked = subscriptionsLive() && !ent.cockpit

  const kpis = computeFinanceKpis({ revenueTotal: totalRevenues, expenseTotal: totalExpenses, expensesByCategory })
  const benchmarks = benchmarksFor(org.businessType)
  const kpiCards = (Object.keys(benchmarks) as MetricKey[]).map((metric) => ({
    metric,
    label: METRIC_LABELS[metric],
    value: kpis[metric],
    benchmark: benchmarks[metric]!,
  }))

  return (
    <DashboardLayout>
      <div className="dash-page">
        {/* Header */}
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {(() => {
                const h = new Date().getHours()
                if (h < 11) return 'Guten Morgen'
                if (h < 18) return 'Guten Tag'
                return 'Guten Abend'
              })()}
            </h1>
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Analyse-Guthaben" value={`${credits} Analyse${credits === 1 ? '' : 'n'}`} sub={`${usedAnalyses} gestartet diesen Monat`} color="gold"
            icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          <StatCard label="Einnahmen (Monat)" value={formatEur(totalRevenues)} sub={trendSub(totalRevenues, prevRevenues)} color="green"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <StatCard label="Ausgaben (Monat)" value={formatEur(totalExpenses)} sub={trendSub(totalExpenses, prevExpenses)} color="red"
            icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          <StatCard label="Ergebnis (Monat)" value={formatEur(profit)} sub={trendSub(profit, prevProfit)} color={profit >= 0 ? 'green' : 'red'}
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </div>

        {!cockpitLocked && (
          <FirstSteps
            hasRevenue={anyRevenue > 0}
            hasExpense={anyExpense > 0}
            hasEmployee={anyEmployee > 0}
            hasReport={reports.length > 0}
          />
        )}

        {cockpitLocked ? (
          /* Paywall-Teaser: Cockpit ist Teil des Abos */
          <div className="rounded-2xl border border-au-gold/30 bg-gradient-to-br from-[#0E1A33] to-[#243459] p-8 text-white mb-6">
            <h2 className="text-xl font-bold mb-2">Ihr Unternehmens-Cockpit wartet</h2>
            <p className="text-white/60 text-sm max-w-xl mb-5">
              Finanzen je Bereich, Branchen-Ampeln, 12-Monats-Trend, wiederkehrende Posten, KPI-Alerts und
              deutlich günstigere Analysen — alles im Profitora-Abo. 14 Tage kostenlos testen.
            </p>
            <Link href="/dashboard/subscription?upgrade=1"
              className="inline-flex items-center gap-2 bg-au-gold text-[#06091A] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-au-gold-light transition-colors">
              Tarife ansehen
            </Link>
          </div>
        ) : (
          <>
            {/* Kennzahlen vs. Branche + Ziele */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 text-sm">Ihre Kennzahlen vs. Branche</h2>
                  <span className="text-[11px] text-gray-400">Basis: aktueller Monat</span>
                </div>
                <div className={`grid gap-3 ${kpiCards.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {kpiCards.map((k) => (
                    <KpiLight key={k.metric} label={k.label} value={k.value} benchmark={k.benchmark} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 text-sm">Monatsziele</h2>
                  <Link href="/dashboard/mein-weg/ziele" className="text-xs text-[#0D1630] hover:underline">Bearbeiten →</Link>
                </div>
                {target?.revenueTarget || target?.expenseTarget ? (
                  <div className="space-y-4">
                    {target.revenueTarget ? <Progress label="Einnahmen" current={totalRevenues} target={target.revenueTarget} /> : null}
                    {target.expenseTarget ? <Progress label="Ausgaben (Limit)" current={totalExpenses} target={target.expenseTarget} invert /> : null}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm mb-2">Noch keine Ziele für diesen Monat.</p>
                    <Link href="/dashboard/mein-weg/ziele" className="text-xs text-[#0D1630] hover:underline">Ziele setzen</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Trend + Hinweise */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 text-sm">12-Monats-Trend</h2>
                  <Link href="/dashboard/finance" className="text-xs text-[#0D1630] hover:underline">Finanzübersicht →</Link>
                </div>
                <TrendSparkline />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-au-gold/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-au-gold" />
                  </div>
                  <h2 className="font-semibold text-gray-900 text-sm">Hinweise</h2>
                </div>
                {alertEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">Keine Auffälligkeiten — gut so. Hinweise erscheinen hier automatisch, sobald eine Kennzahl vom Branchen-Richtwert abweicht.</p>
                ) : (
                  <div className="space-y-2.5">
                    {alertEvents.map((a) => (
                      <div key={a.id} className="flex gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-amber-800 text-xs leading-relaxed">{a.message}</p>
                          <p className="text-amber-600/60 text-[10px] mt-0.5">{new Date(a.createdAt).toLocaleDateString('de-DE')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kosten + Analysen + Team-Teaser */}
            <div className="grid lg:grid-cols-3 gap-6">
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
                      <MiniBar key={cat} label={cat} amount={amt} max={maxCat} />
                    ))}
                  </div>
                )}
              </div>

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

              {/* Team: Wer ist jetzt im Dienst? (Business+ nach Launch) */}
              {ent.shifts || !subscriptionsLive() ? (
                <OnDutyCard organizationId={org.id} />
              ) : (
                <div className="rounded-xl border border-dashed border-au-gold/40 bg-au-gold/5 p-6 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-[#B8923A] uppercase tracking-widest mb-2">Business-Abo</p>
                  <h2 className="font-semibold text-gray-900 text-sm mb-1.5">Team & Schichtplan</h2>
                  <p className="text-gray-500 text-xs leading-relaxed mb-3">
                    Wochenpläne erstellen und live sehen, wer gerade arbeitet.
                  </p>
                  <Link href="/dashboard/subscription?upgrade=1" className="text-xs text-[#0D1630] font-semibold hover:underline">Upgrade ansehen →</Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
