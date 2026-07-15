import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrgContext, shiftsBlocked, shiftsForbiddenResponse } from '@/lib/entitlements-server'
import { shiftsOverlap, isAbsent, weekDates } from '@/lib/shifts'

function weekRange(weekParam: string | null): { days: string[]; from: Date; to: Date } {
  const base = weekParam ? new Date(`${weekParam}T00:00:00.000Z`) : new Date()
  const days = weekDates(Number.isNaN(base.getTime()) ? new Date() : base)
  const from = new Date(`${days[0]}T00:00:00.000Z`)
  const to = new Date(`${days[6]}T00:00:00.000Z`)
  to.setUTCDate(to.getUTCDate() + 1)
  return { days, from, to }
}

export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const { days, from, to } = weekRange(new URL(req.url).searchParams.get('week'))
  const [shifts, absences] = await Promise.all([
    db.shift.findMany({
      where: { organizationId: ctx.organizationId, date: { gte: from, lt: to } },
      include: { area: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { startMin: 'asc' }],
    }),
    db.absence.findMany({
      where: { organizationId: ctx.organizationId, startDate: { lt: to }, endDate: { gte: from } },
    }),
  ])
  return NextResponse.json({ success: true, data: { days, shifts, absences } })
}

async function validateAndConflictCheck(
  orgId: string,
  body: { employeeId?: string; date?: string; startMin?: number; endMin?: number },
  excludeShiftId?: string,
): Promise<{ error?: string; status?: number; employeeId?: string; date?: Date; startMin?: number; endMin?: number }> {
  const employeeId = typeof body.employeeId === 'string' ? body.employeeId : ''
  const startMin = Number(body.startMin)
  const endMin = Number(body.endMin)
  const date = body.date ? new Date(`${String(body.date).slice(0, 10)}T00:00:00.000Z`) : null

  if (!employeeId || !date || Number.isNaN(date.getTime())) return { error: 'Ungültige Eingaben.', status: 400 }
  if (!Number.isInteger(startMin) || !Number.isInteger(endMin) || startMin < 0 || endMin > 1440 || endMin <= startMin) {
    return { error: 'Ungültige Zeiten (Ende muss nach Beginn liegen, max. 24:00).', status: 400 }
  }
  const employee = await db.employee.findFirst({ where: { id: employeeId, organizationId: orgId, active: true } })
  if (!employee) return { error: 'Mitarbeiter nicht gefunden.', status: 404 }

  const dateKey = date.toISOString().slice(0, 10)
  const absences = await db.absence.findMany({
    where: { organizationId: orgId, employeeId, startDate: { lte: date }, endDate: { gte: date } },
  })
  if (isAbsent(absences, employeeId, dateKey)) {
    return { error: 'Mitarbeiter ist an diesem Tag abwesend (Urlaub/Krank).', status: 409 }
  }

  const sameDay = await db.shift.findMany({ where: { organizationId: orgId, employeeId, date } })
  const conflict = sameDay.find((s) => s.id !== excludeShiftId && shiftsOverlap(s.startMin, s.endMin, startMin, endMin))
  if (conflict) {
    return { error: 'Überschneidung mit einer bestehenden Schicht an diesem Tag.', status: 409 }
  }
  return { employeeId, date, startMin, endMin }
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const v = await validateAndConflictCheck(ctx.organizationId, body ?? {})
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status })

  let areaId: string | null = typeof body?.areaId === 'string' && body.areaId ? body.areaId : null
  if (areaId) {
    const area = await db.area.findFirst({ where: { id: areaId, organizationId: ctx.organizationId } })
    if (!area) areaId = null
  }
  const shift = await db.shift.create({
    data: {
      organizationId: ctx.organizationId,
      employeeId: v.employeeId!,
      date: v.date!,
      startMin: v.startMin!,
      endMin: v.endMin!,
      areaId,
      note: typeof body?.note === 'string' ? body.note.slice(0, 200) || null : null,
    },
    include: { area: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ success: true, data: shift })
}

export async function PUT(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const existing = await db.shift.findFirst({ where: { id: body?.id, organizationId: ctx.organizationId } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const v = await validateAndConflictCheck(ctx.organizationId, body ?? {}, existing.id)
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status })

  let areaId: string | null = typeof body?.areaId === 'string' && body.areaId ? body.areaId : null
  if (areaId) {
    const area = await db.area.findFirst({ where: { id: areaId, organizationId: ctx.organizationId } })
    if (!area) areaId = null
  }
  const updated = await db.shift.update({
    where: { id: existing.id },
    data: {
      employeeId: v.employeeId!,
      date: v.date!,
      startMin: v.startMin!,
      endMin: v.endMin!,
      areaId,
      note: typeof body?.note === 'string' ? body.note.slice(0, 200) || null : null,
    },
    include: { area: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.shift.deleteMany({ where: { id, organizationId: ctx.organizationId } })
  return NextResponse.json({ success: true })
}
