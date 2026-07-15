import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse, getOrgContext } from '@/lib/entitlements-server'
import { subscriptionsLive } from '@/lib/entitlements'
import { buildTaxExportCsv, type TaxExportRow } from '@/lib/tax-export'

// GET ?year=2026 → Steuerberater-CSV (alle Einnahmen + Ausgaben des Jahres).
// Business+ (flag-gated): DATEV-/Steuerberater-Export ist Teil des Business-Abos.
export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()

  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  if (subscriptionsLive() && !ctx.entitlements.datevExport) {
    return NextResponse.json(
      { error: 'Der Steuerberater-Export ist Teil des Business-Abos.', upgradeRequired: true },
      { status: 403 },
    )
  }

  const yearParam = Number(new URL(req.url).searchParams.get('year'))
  const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : new Date().getFullYear()
  const from = new Date(Date.UTC(year, 0, 1))
  const to = new Date(Date.UTC(year + 1, 0, 1))

  const [expenses, revenues] = await Promise.all([
    db.expense.findMany({
      where: { organizationId: ctx.organizationId, date: { gte: from, lt: to } },
      include: { area: { select: { name: true } } },
      orderBy: { date: 'asc' },
    }),
    db.revenue.findMany({
      where: { organizationId: ctx.organizationId, date: { gte: from, lt: to } },
      include: { area: { select: { name: true } } },
      orderBy: { date: 'asc' },
    }),
  ])

  const rows: TaxExportRow[] = [
    ...expenses.map((e): TaxExportRow => ({
      date: e.date,
      kind: 'Ausgabe',
      category: e.category,
      area: e.area?.name ?? null,
      description: e.description,
      counterparty: e.vendor,
      gross: e.amount,
      vatRate: e.vatRate,
      status: e.paymentMethod,
      hasReceipt: Boolean(e.receiptPath),
    })),
    ...revenues.map((r): TaxExportRow => ({
      date: r.date,
      kind: 'Einnahme',
      category: r.category,
      area: r.area?.name ?? null,
      description: r.description,
      counterparty: r.customerOrSource,
      gross: r.amount,
      vatRate: r.vatRate,
      status: r.paymentStatus,
      hasReceipt: Boolean(r.receiptPath),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const csv = buildTaxExportCsv(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="profitora-export-${year}.csv"`,
    },
  })
}
