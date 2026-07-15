import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrgContext, shiftsBlocked, shiftsForbiddenResponse } from '@/lib/entitlements-server'
import { isAbsent, shiftsOverlap, weekDates } from '@/lib/shifts'

// POST { fromWeek: 'YYYY-MM-DD', toWeek: 'YYYY-MM-DD' } — kopiert alle Schichten
// der Quellwoche tagesversetzt in die Zielwoche; Konflikte werden übersprungen.
export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const fromBase = new Date(`${String(body?.fromWeek ?? '').slice(0, 10)}T00:00:00.000Z`)
  const toBase = new Date(`${String(body?.toWeek ?? '').slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(fromBase.getTime()) || Number.isNaN(toBase.getTime())) {
    return NextResponse.json({ error: 'Ungültige Wochenangaben.' }, { status: 400 })
  }
  const fromDays = weekDates(fromBase)
  const toDays = weekDates(toBase)

  const from = new Date(`${fromDays[0]}T00:00:00.000Z`)
  const fromEnd = new Date(from)
  fromEnd.setUTCDate(fromEnd.getUTCDate() + 7)
  const to = new Date(`${toDays[0]}T00:00:00.000Z`)
  const toEnd = new Date(to)
  toEnd.setUTCDate(toEnd.getUTCDate() + 7)

  const [source, existing, absences, activeEmployees] = await Promise.all([
    db.shift.findMany({ where: { organizationId: ctx.organizationId, date: { gte: from, lt: fromEnd } } }),
    db.shift.findMany({ where: { organizationId: ctx.organizationId, date: { gte: to, lt: toEnd } } }),
    db.absence.findMany({ where: { organizationId: ctx.organizationId, startDate: { lt: toEnd }, endDate: { gte: to } } }),
    db.employee.findMany({ where: { organizationId: ctx.organizationId, active: true }, select: { id: true } }),
  ])
  const activeIds = new Set(activeEmployees.map((e) => e.id))

  let copied = 0
  let skipped = 0
  const toCreate: {
    organizationId: string
    employeeId: string
    date: Date
    startMin: number
    endMin: number
    areaId: string | null
    note: string | null
  }[] = []

  for (const s of source) {
    const dayIdx = fromDays.indexOf(s.date.toISOString().slice(0, 10))
    if (dayIdx < 0 || !activeIds.has(s.employeeId)) {
      skipped++
      continue
    }
    const targetKey = toDays[dayIdx]
    const targetDate = new Date(`${targetKey}T00:00:00.000Z`)
    const conflict =
      isAbsent(absences, s.employeeId, targetKey) ||
      existing.some(
        (e) =>
          e.employeeId === s.employeeId &&
          e.date.toISOString().slice(0, 10) === targetKey &&
          shiftsOverlap(e.startMin, e.endMin, s.startMin, s.endMin),
      ) ||
      toCreate.some(
        (e) =>
          e.employeeId === s.employeeId &&
          e.date.getTime() === targetDate.getTime() &&
          shiftsOverlap(e.startMin, e.endMin, s.startMin, s.endMin),
      )
    if (conflict) {
      skipped++
      continue
    }
    toCreate.push({
      organizationId: ctx.organizationId,
      employeeId: s.employeeId,
      date: targetDate,
      startMin: s.startMin,
      endMin: s.endMin,
      areaId: s.areaId,
      note: s.note,
    })
    copied++
  }

  if (toCreate.length > 0) await db.shift.createMany({ data: toCreate })
  return NextResponse.json({ success: true, data: { copied, skipped } })
}
