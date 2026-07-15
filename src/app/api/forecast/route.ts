import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { featureBlocked, featureForbiddenResponse, getOrgContext } from '@/lib/entitlements-server'
import { forecastSeries } from '@/lib/forecast'

// 24 Monate Historie + 12 Monate Prognose für Einnahmen und Ausgaben (Premium).
export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await featureBlocked('forecast')) return featureForbiddenResponse('Der Forecast')
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 23, 1))
  const [expenses, revenues] = await Promise.all([
    db.expense.findMany({ where: { organizationId: ctx.organizationId, date: { gte: start } }, select: { date: true, amount: true } }),
    db.revenue.findMany({ where: { organizationId: ctx.organizationId, date: { gte: start } }, select: { date: true, amount: true } }),
  ])

  const monthKeys: string[] = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 23 + i, 1))
    monthKeys.push(d.toISOString().slice(0, 7))
  }
  const sumByMonth = (rows: { date: Date; amount: number }[]) => {
    const map: Record<string, number> = {}
    for (const r of rows) {
      const key = r.date.toISOString().slice(0, 7)
      map[key] = (map[key] ?? 0) + r.amount
    }
    return monthKeys.map((k) => Math.round((map[k] ?? 0) * 100) / 100)
  }

  const revHistory = sumByMonth(revenues)
  const expHistory = sumByMonth(expenses)
  // Führende Leermonate abschneiden (vor dem ersten Eintrag)
  const firstIdx = Math.min(
    revHistory.findIndex((v) => v > 0) === -1 ? 24 : revHistory.findIndex((v) => v > 0),
    expHistory.findIndex((v) => v > 0) === -1 ? 24 : expHistory.findIndex((v) => v > 0),
  )
  if (firstIdx >= 24) {
    return NextResponse.json({ success: true, data: { months: [], forecastMonths: [], revenue: [], expenses: [], revenueForecast: [], expensesForecast: [] } })
  }
  const keys = monthKeys.slice(firstIdx)
  const rev = revHistory.slice(firstIdx)
  const exp = expHistory.slice(firstIdx)

  const revForecast = forecastSeries(keys.map((k, i) => ({ month: k, value: rev[i] })), 12)
  const expForecast = forecastSeries(keys.map((k, i) => ({ month: k, value: exp[i] })), 12)

  const forecastMonths: string[] = []
  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))
    forecastMonths.push(d.toISOString().slice(0, 7))
  }

  return NextResponse.json({
    success: true,
    data: { months: keys, forecastMonths, revenue: rev, expenses: exp, revenueForecast: revForecast, expensesForecast: expForecast },
  })
}
