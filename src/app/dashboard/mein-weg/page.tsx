import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MonthlyBarChart from '@/components/charts/MonthlyBarChart'

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function DeltaBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0
  const pct = value === 0 ? null : `${value > 0 ? '+' : ''}${formatEur(value)}`
  if (!pct) return <span className="text-xs text-gray-400">±0 €</span>
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {pct}
    </span>
  )
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const over = target > 0 && value > target
  return (
    <div className="mt-1">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? '#f59e0b' : color }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-gray-400">{formatEur(value)}</span>
        <span className="text-xs text-gray-400">Ziel: {formatEur(target)}</span>
      </div>
    </div>
  )
}

export default async function MeinWegPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
    include: { organization: true },
  })
  if (!membership) redirect('/onboarding')

  const org = membership.organization
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const monthStart = new Date(thisYear, thisMonth - 1, 1)
  const monthEnd = new Date(thisYear, thisMonth, 0)
  const prevStart = new Date(prevYear, prevMonth - 1, 1)
  const prevEnd = new Date(prevYear, prevMonth, 0)

  const twelveAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [curExp, curRev, prevExp, prevRev, allExp, allRev, targets, lastReport] = await Promise.all([
    db.expense.findMany({ where: { organizationId: org.id, date: { gte: monthStart, lte: monthEnd } }, select: { amount: true } }),
    db.revenue.findMany({ where: { organizationId: org.id, date: { gte: monthStart, lte: monthEnd } }, select: { amount: true } }),
    db.expense.findMany({ where: { organizationId: org.id, date: { gte: prevStart, lte: prevEnd } }, select: { amount: true } }),
    db.revenue.findMany({ where: { organizationId: org.id, date: { gte: prevStart, lte: prevEnd } }, select: { amount: true } }),
    db.expense.findMany({ where: { organizationId: org.id, date: { gte: twelveAgo } }, select: { date: true, amount: true } }),
    db.revenue.findMany({ where: { organizationId: org.id, date: { gte: twelveAgo } }, select: { date: true, amount: true } }),
    db.monthlyTarget.findMany({ where: { organizationId: org.id }, orderBy: [{ year: 'asc' }, { month: 'asc' }] }),
    db.analysisReport.findFirst({ where: { organizationId: org.id, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } }),
  ])

  const curRevTotal = curRev.reduce((s, r) => s + r.amount, 0)
  const curExpTotal = curExp.reduce((s, e) => s + e.amount, 0)
  const curProfit = curRevTotal - curExpTotal

  const prevRevTotal = prevRev.reduce((s, r) => s + r.amount, 0)
  const prevExpTotal = prevExp.reduce((s, e) => s + e.amount, 0)
  const prevProfit = prevRevTotal - prevExpTotal

  // Build 12-month chart data
  const expByMonth: Record<string, number> = {}
  const revByMonth: Record<string, number> = {}
  for (const e of allExp) {
    const key = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`
    expByMonth[key] = (expByMonth[key] ?? 0) + e.amount
  }
  for (const r of allRev) {
    const key = `${r.date.getFullYear()}-${r.date.getMonth() + 1}`
    revByMonth[key] = (revByMonth[key] ?? 0) + r.amount
  }

  const chartMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const key = `${y}-${m}`
    const t = targets.find((tg) => tg.year === y && tg.month === m)
    return {
      key, year: y, month: m,
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      revenue: revByMonth[key] ?? 0,
      expenses: expByMonth[key] ?? 0,
      profit: (revByMonth[key] ?? 0) - (expByMonth[key] ?? 0),
      revenueTarget: t?.revenueTarget ?? null,
      expenseTarget: t?.expenseTarget ?? null,
    }
  })

  const currentTarget = targets.find((t) => t.year === thisYear && t.month === thisMonth)
  const hasAnyData = curRevTotal > 0 || curExpTotal > 0

  // Streak: how many months in a row was profit positive?
  let profitStreak = 0
  for (let i = chartMonths.length - 1; i >= 0; i--) {
    if (chartMonths[i].profit > 0) profitStreak++
    else break
  }

  const monthLabel = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mein Weg zur Profitabilität</h1>
            <p className="text-gray-500 text-sm mt-1">{org.name} · {monthLabel}</p>
          </div>
          <Link
            href="/dashboard/mein-weg/ziele"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            Ziele setzen
          </Link>
        </div>

        {/* Current month KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Umsatz {monthLabel}</p>
            <p className="text-2xl font-bold text-gray-900">{formatEur(curRevTotal)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">vs. Vormonat</span>
              <DeltaBadge value={curRevTotal - prevRevTotal} />
            </div>
            {currentTarget?.revenueTarget && (
              <ProgressBar value={curRevTotal} target={currentTarget.revenueTarget} color="#16a34a" />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ausgaben {monthLabel}</p>
            <p className="text-2xl font-bold text-gray-900">{formatEur(curExpTotal)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">vs. Vormonat</span>
              <DeltaBadge value={curExpTotal - prevExpTotal} inverse />
            </div>
            {currentTarget?.expenseTarget && (
              <ProgressBar value={curExpTotal} target={currentTarget.expenseTarget} color="#dc2626" />
            )}
          </div>

          <div className={`rounded-xl border p-5 shadow-sm ${curProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${curProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Ergebnis {monthLabel}
            </p>
            <p className={`text-2xl font-bold ${curProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatEur(curProfit)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">vs. Vormonat</span>
              <DeltaBadge value={curProfit - prevProfit} />
            </div>
            {profitStreak > 1 && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                {profitStreak} Monate profitabel in Folge
              </p>
            )}
          </div>
        </div>

        {/* Charts */}
        {hasAnyData ? (
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Umsatz (12 Monate)</h2>
              <MonthlyBarChart months={chartMonths} mode="revenue" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Ausgaben (12 Monate)</h2>
              <MonthlyBarChart months={chartMonths} mode="expenses" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Ergebnis (12 Monate)</h2>
              <MonthlyBarChart months={chartMonths} mode="profit" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center mb-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Noch keine Daten für Charts</h3>
            <p className="text-gray-400 text-sm mb-4">Tragen Sie Einnahmen und Ausgaben ein, um Ihren Fortschritt zu sehen.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/revenues" className="text-sm bg-[#0D1630] text-white px-4 py-2 rounded-lg hover:bg-[#152040] transition-colors">
                Einnahmen eintragen
              </Link>
              <Link href="/dashboard/costs" className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Ausgaben eintragen
              </Link>
            </div>
          </div>
        )}

        {/* Monthly comparison table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Monatliche Übersicht</h2>
            <span className="text-xs text-gray-400">Letzte 12 Monate</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Monat</th>
                  <th className="text-right px-4 py-3">Umsatz</th>
                  <th className="text-right px-4 py-3">Ausgaben</th>
                  <th className="text-right px-4 py-3">Ergebnis</th>
                  <th className="text-right px-4 py-3">Marge</th>
                  <th className="text-right px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...chartMonths].reverse().map((m) => {
                  const isCurrentMonth = m.year === thisYear && m.month === thisMonth
                  const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : null
                  const hasData = m.revenue > 0 || m.expenses > 0
                  return (
                    <tr key={m.key} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${isCurrentMonth ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {m.label}
                        {isCurrentMonth && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Aktuell</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">
                        {hasData ? formatEur(m.revenue) : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        {hasData ? formatEur(m.expenses) : <span className="text-gray-300">–</span>}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${!hasData ? 'text-gray-300' : m.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {hasData ? formatEur(m.profit) : '–'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {margin !== null ? `${margin.toFixed(1)} %` : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {!hasData ? (
                          <span className="text-xs text-gray-300">keine Daten</span>
                        ) : m.profit > 0 ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Gewinn</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Verlust</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA: Analyse starten */}
        <div className="bg-gradient-to-r from-[#0D1630] to-[#1a2744] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Bereit für eine tiefere Analyse?</h3>
              <p className="text-white/60 text-sm mt-1">
                {lastReport
                  ? `Letzte KI-Analyse: ${new Date(lastReport.createdAt).toLocaleDateString('de-DE')} · Starten Sie eine neue für aktuelle Erkenntnisse.`
                  : 'Lassen Sie Ihre Zahlen von der KI analysieren und erhalten Sie konkrete Sparpotenziale in Euro.'}
              </p>
            </div>
            <Link
              href="/dashboard/new-analysis"
              className="flex items-center gap-2 bg-[#C9A84C] text-[#0D1630] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#d4b366] transition-colors flex-shrink-0 ml-6"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
              </svg>
              KI-Analyse starten
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
