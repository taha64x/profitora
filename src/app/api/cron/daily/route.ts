export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { advanceNextRun, type RecurringInterval } from '@/lib/recurring'
import { benchmarksFor, computeFinanceKpis, METRIC_LABELS, type MetricKey } from '@/lib/benchmarks'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'
import { sendKpiAlertEmail } from '@/lib/email'

// Vercel Cron ruft täglich 04:00 UTC mit `Authorization: Bearer <CRON_SECRET>`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  const now = new Date()
  const result = { recurringCreated: 0, monthlyReset: false, alertsFired: 0 }

  // ── 1) Wiederkehrende Posten erzeugen (holt verpasste Läufe nach, Kappe 24) ──
  const due = await db.recurringEntry.findMany({ where: { active: true, nextRun: { lte: now } } })
  for (const entry of due) {
    let nextRun = entry.nextRun
    let guard = 0
    while (nextRun <= now && guard < 24) {
      const runDate = nextRun
      const data = {
        organizationId: entry.organizationId,
        createdById: 'system-cron',
        date: runDate,
        category: entry.category,
        areaId: entry.areaId,
        vatRate: entry.vatRate,
        description: entry.description,
        amount: entry.amount,
        isRecurring: true,
        recurrenceInterval: entry.interval,
        recurringEntryId: entry.id,
      }
      if (entry.kind === 'EXPENSE') {
        await db.expense.create({ data: { ...data, vendor: entry.vendor } })
      } else {
        await db.revenue.create({ data: { ...data, customerOrSource: entry.vendor } })
      }
      result.recurringCreated++
      nextRun = advanceNextRun(nextRun, entry.interval as RecurringInterval)
      guard++
    }
    await db.recurringEntry.update({ where: { id: entry.id }, data: { nextRun } })
  }

  // ── 2) Monatsreset am 1. (Assistent- und Analyse-Zähler) ────────────────────
  if (now.getUTCDate() === 1) {
    await db.subscription.updateMany({ data: { usedAnalysesThisMonth: 0, assistantMsgsThisMonth: 0 } })
    result.monthlyReset = true
  }

  // ── 3) KPI-Alerts (ab dem 7. des Monats, Throttle 7 Tage je Regel) ──────────
  if (now.getUTCDate() >= 7) {
    result.alertsFired = await runKpiAlerts(now)
  }

  return NextResponse.json({ success: true, data: result })
}

async function runKpiAlerts(now: Date): Promise<number> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const throttleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  let fired = 0

  const orgs = await db.organization.findMany({
    select: { id: true, name: true, businessType: true, subscription: true, settings: true },
  })
  for (const org of orgs) {
    // Alerts sind Business+ — greift erst mit Launch-Flag, davor für alle (Produkt jung).
    if (subscriptionsLive() && !getEntitlements(org.subscription).alerts) continue

    const [expenses, revenues] = await Promise.all([
      db.expense.groupBy({
        by: ['category'],
        where: { organizationId: org.id, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      db.revenue.aggregate({
        where: { organizationId: org.id, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ])
    const revenueTotal = revenues._sum.amount ?? 0
    if (revenueTotal <= 0) continue
    const expensesByCategory = Object.fromEntries(expenses.map((e) => [e.category, e._sum.amount ?? 0]))
    const expenseTotal = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)
    const kpis = computeFinanceKpis({ revenueTotal, expenseTotal, expensesByCategory })
    const benchmarks = benchmarksFor(org.businessType)

    // Default-Regeln lazy anlegen (Schwelle = warning-Wert der Branche)
    const metrics = Object.keys(benchmarks) as MetricKey[]
    for (const metric of metrics) {
      const b = benchmarks[metric]!
      await db.alertRule.upsert({
        where: { organizationId_metric: { organizationId: org.id, metric } },
        create: {
          organizationId: org.id,
          metric,
          threshold: b.warning,
          direction: b.target <= b.warning ? 'ABOVE' : 'BELOW',
        },
        update: {},
      })
    }

    const rules = await db.alertRule.findMany({ where: { organizationId: org.id, active: true } })
    for (const rule of rules) {
      const value = kpis[rule.metric as MetricKey]
      if (value === null || value === undefined || typeof value !== 'number') continue
      const breached = rule.direction === 'ABOVE' ? value > rule.threshold : value < rule.threshold
      if (!breached) continue
      if (rule.lastFiredAt && rule.lastFiredAt > throttleBefore) continue

      const label = METRIC_LABELS[rule.metric as MetricKey] ?? rule.metric
      const message = `${label} liegt aktuell bei ${value.toLocaleString('de-DE')} % (Richtwert Ihrer Branche: ${rule.threshold.toLocaleString('de-DE')} %).`
      await db.$transaction([
        db.alertEvent.create({
          data: { organizationId: org.id, metric: rule.metric, value, threshold: rule.threshold, message },
        }),
        db.alertRule.update({ where: { id: rule.id }, data: { lastFiredAt: now } }),
      ])
      fired++

      if (org.settings?.emailNotifications !== false) {
        const owner = await db.organizationMember.findFirst({
          where: { organizationId: org.id, role: 'OWNER' },
          include: { user: { select: { email: true } } },
        })
        if (owner?.user.email) {
          await sendKpiAlertEmail(owner.user.email, org.name, message).catch((err) =>
            console.error('[cron] Alert-Mail fehlgeschlagen:', err),
          )
        }
      }
    }
  }
  return fired
}
