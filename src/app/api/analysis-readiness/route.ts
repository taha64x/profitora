import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { classifyCategory } from '@/lib/benchmarks'

// Datenqualitäts-Score für den Analyse-Wizard: Wie gut ist die Datenlage,
// was würde im Bericht fehlen? (Spec §5.1 — ehrliche Erwartungssteuerung.)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (!m) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const orgId = m.organizationId

  const since = new Date()
  since.setMonth(since.getMonth() - 12)

  const [expenses, revenueCount, uploads, shiftCount] = await Promise.all([
    db.expense.findMany({ where: { organizationId: orgId, date: { gte: since } }, select: { date: true, category: true } }),
    db.revenue.count({ where: { organizationId: orgId, date: { gte: since } } }),
    db.upload.groupBy({ by: ['category'], where: { organizationId: orgId }, _count: true }),
    db.shift.count({ where: { organizationId: orgId, date: { gte: since } } }),
  ])

  const monthsWithExpenses = new Set(expenses.map((e) => e.date.toISOString().slice(0, 7))).size
  const hasLabor = expenses.some((e) => classifyCategory(e.category) === 'labor')
  const hasGoods = expenses.some((e) => classifyCategory(e.category) === 'goods')
  const hasEnergy = expenses.some((e) => classifyCategory(e.category) === 'energy')
  const uploadCats = new Set(uploads.map((u) => u.category))

  let score = 0
  const hints: string[] = []

  if (revenueCount > 0) score += 25
  else hints.push('Keine Einnahmen erfasst — ohne Umsatz keine Quoten, Margen oder Sparpotenziale in Euro.')
  if (expenses.length > 0) score += 20
  else hints.push('Keine Ausgaben erfasst — Kostenanalyse (Abschnitt 4) entfällt weitgehend.')
  if (monthsWithExpenses >= 3) score += 15
  else if (expenses.length > 0) hints.push('Weniger als 3 Monate Kostendaten — Trends und Vergleiche bleiben vage.')
  if (hasLabor) score += 10
  else hints.push('Keine Personal-Kategorie gebucht — Personalkostenquote (Abschnitt 5) nicht berechenbar.')
  if (hasGoods) score += 5
  if (hasEnergy) score += 5
  else hints.push('Keine Energie-Kosten erfasst — Energie-Sparpotenziale entfallen.')
  if (uploadCats.size > 0) score += 10
  else hints.push('Keine Dateien hochgeladen — Belegungs-/Stundendaten (ADR, RevPAR, Produktivität) fehlen.')
  if (uploadCats.has('EMPLOYEE_HOURS') || shiftCount > 0) score += 10
  else hints.push('Keine Arbeitsstunden (Upload oder Schichtplan) — Produktivitätskennzahlen entfallen.')

  return NextResponse.json({
    success: true,
    data: {
      score: Math.min(100, score),
      hints,
      facts: {
        revenueCount,
        expenseCount: expenses.length,
        monthsWithExpenses,
        uploadCategories: [...uploadCats],
        plannedShifts: shiftCount,
      },
    },
  })
}
