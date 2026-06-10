import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen.' }, { status: 400 })

    const orgId = membership.organizationId
    const start = new Date()
    start.setMonth(start.getMonth() - 11)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    const [expenses, revenues, targets] = await Promise.all([
      db.expense.findMany({
        where: { organizationId: orgId, date: { gte: start } },
        select: { date: true, amount: true },
      }),
      db.revenue.findMany({
        where: { organizationId: orgId, date: { gte: start } },
        select: { date: true, amount: true },
      }),
      db.monthlyTarget.findMany({
        where: { organizationId: orgId },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
    ])

    const expByMonth: Record<string, number> = {}
    const revByMonth: Record<string, number> = {}

    for (const e of expenses) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`
      expByMonth[key] = (expByMonth[key] ?? 0) + e.amount
    }
    for (const r of revenues) {
      const key = `${r.date.getFullYear()}-${r.date.getMonth() + 1}`
      revByMonth[key] = (revByMonth[key] ?? 0) + r.amount
    }

    const months: {
      key: string; year: number; month: number; label: string
      revenue: number; expenses: number; profit: number
      revenueTarget: number | null; expenseTarget: number | null
    }[] = []

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const key = `${y}-${m}`
      const rev = revByMonth[key] ?? 0
      const exp = expByMonth[key] ?? 0
      const target = targets.find((t) => t.year === y && t.month === m)
      months.push({
        key,
        year: y,
        month: m,
        label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
        revenueTarget: target?.revenueTarget ?? null,
        expenseTarget: target?.expenseTarget ?? null,
      })
    }

    return NextResponse.json({ months })
  } catch (err) {
    console.error('[monthly-summary]', err)
    return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 })
  }
}
