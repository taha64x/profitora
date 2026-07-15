import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse, getOrgContext } from '@/lib/entitlements-server'
import { subscriptionsLive } from '@/lib/entitlements'

const COLORS = new Set(['#0E1A33', '#C9A84C', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#db2777'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBody(body: any) {
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  const cents = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null
  }
  return {
    name: str(body?.name, 100),
    position: str(body?.position, 100),
    email: str(body?.email, 200),
    phone: str(body?.phone, 50),
    address: str(body?.address, 300),
    hourlyWageCents: cents(body?.hourlyWageCents),
    monthlySalaryCents: cents(body?.monthlySalaryCents),
    weeklyHours: Number.isFinite(Number(body?.weeklyHours)) && Number(body.weeklyHours) > 0 ? Number(body.weeklyHours) : null,
    vacationDaysPerYear: Number.isInteger(Number(body?.vacationDaysPerYear)) && Number(body.vacationDaysPerYear) > 0 ? Number(body.vacationDaysPerYear) : null,
    color: COLORS.has(body?.color) ? (body.color as string) : '#0E1A33',
    notes: str(body?.notes, 500),
  }
}

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const employees = await db.employee.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })
  return NextResponse.json({ success: true, data: employees })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  // Tarif-Limit (greift erst mit Launch-Flag)
  if (subscriptionsLive()) {
    const count = await db.employee.count({ where: { organizationId: ctx.organizationId, active: true } })
    if (count >= ctx.entitlements.maxEmployees) {
      return NextResponse.json(
        { error: `Ihr Tarif erlaubt bis zu ${ctx.entitlements.maxEmployees} Mitarbeiter. Upgraden Sie für mehr.`, upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  const body = await req.json().catch(() => null)
  const p = parseBody(body)
  if (!p.name) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 })

  const employee = await db.employee.create({
    data: { organizationId: ctx.organizationId, ...p, name: p.name },
  })
  return NextResponse.json({ success: true, data: employee })
}

export async function PUT(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const existing = await db.employee.findFirst({ where: { id: body?.id, organizationId: ctx.organizationId } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  // Nur-Toggle (active)
  if (typeof body?.active === 'boolean' && Object.keys(body).length === 2) {
    const updated = await db.employee.update({ where: { id: existing.id }, data: { active: body.active } })
    return NextResponse.json({ success: true, data: updated })
  }

  const p = parseBody(body)
  if (!p.name) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 })
  const updated = await db.employee.update({
    where: { id: existing.id },
    data: { ...p, name: p.name, active: typeof body?.active === 'boolean' ? body.active : undefined },
  })
  return NextResponse.json({ success: true, data: updated })
}

// DELETE = deaktivieren (Soft-Delete: Schichten/Kostenhistorie bleiben erhalten)
export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.employee.updateMany({ where: { id, organizationId: ctx.organizationId }, data: { active: false } })
  return NextResponse.json({ success: true })
}
