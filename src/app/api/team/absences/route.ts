import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrgContext, shiftsBlocked, shiftsForbiddenResponse } from '@/lib/entitlements-server'

const TYPES = new Set(['VACATION', 'SICK', 'OFF'])

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const absences = await db.absence.findMany({
    where: { organizationId: ctx.organizationId },
    include: { employee: { select: { id: true, name: true, color: true } } },
    orderBy: { startDate: 'desc' },
    take: 200,
  })
  return NextResponse.json({ success: true, data: absences })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const type = TYPES.has(body?.type) ? (body.type as string) : null
  const startDate = body?.startDate ? new Date(`${String(body.startDate).slice(0, 10)}T00:00:00.000Z`) : null
  const endDate = body?.endDate ? new Date(`${String(body.endDate).slice(0, 10)}T00:00:00.000Z`) : null
  if (!type || !startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return NextResponse.json({ error: 'Ungültige Eingaben (Ende vor Beginn?).' }, { status: 400 })
  }
  const employee = await db.employee.findFirst({ where: { id: body?.employeeId, organizationId: ctx.organizationId } })
  if (!employee) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden.' }, { status: 404 })

  const absence = await db.absence.create({
    data: {
      organizationId: ctx.organizationId,
      employeeId: employee.id,
      type,
      startDate,
      endDate,
      note: typeof body?.note === 'string' ? body.note.slice(0, 200) || null : null,
    },
    include: { employee: { select: { id: true, name: true, color: true } } },
  })
  return NextResponse.json({ success: true, data: absence })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.absence.deleteMany({ where: { id, organizationId: ctx.organizationId } })
  return NextResponse.json({ success: true })
}
