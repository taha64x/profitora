import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import type { RecurringInterval } from '@/lib/recurring'

const INTERVALS = new Set<RecurringInterval>(['monthly', 'quarterly', 'yearly'])

async function getOrgId(userId: string) {
  const m = await db.organizationMember.findFirst({ where: { userId } })
  return m?.organizationId ?? null
}

async function safeAreaId(areaId: unknown, orgId: string): Promise<string | null> {
  if (typeof areaId !== 'string' || !areaId) return null
  const area = await db.area.findFirst({ where: { id: areaId, organizationId: orgId } })
  return area ? areaId : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBody(body: any) {
  const kind = body?.kind === 'INCOME' ? 'INCOME' : body?.kind === 'EXPENSE' ? 'EXPENSE' : null
  const amount = Number(body?.amount)
  const category = typeof body?.category === 'string' && body.category ? body.category : null
  const description = typeof body?.description === 'string' ? body.description.slice(0, 300).trim() : ''
  const interval = INTERVALS.has(body?.interval) ? (body.interval as RecurringInterval) : null
  const nextRun = body?.nextRun ? new Date(body.nextRun) : new Date()
  const vatRate = [0, 7, 19].includes(Number(body?.vatRate)) ? Number(body.vatRate) : null
  const vendor = typeof body?.vendor === 'string' ? body.vendor.slice(0, 200) || null : null
  return { kind, amount, category, description, interval, nextRun, vatRate, vendor }
}

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const entries = await db.recurringEntry.findMany({
    where: { organizationId: orgId },
    orderBy: [{ active: 'desc' }, { nextRun: 'asc' }],
  })
  const areas = await db.area.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } })
  const areaById = new Map(areas.map((a) => [a.id, a.name]))
  const data = entries.map((e) => ({ ...e, areaName: e.areaId ? areaById.get(e.areaId) ?? null : null }))
  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const p = parseBody(body)
  if (!p.kind || !p.category || !p.description || !p.interval || !Number.isFinite(p.amount) || p.amount <= 0 || Number.isNaN(p.nextRun.getTime())) {
    return NextResponse.json({ error: 'Ungültige Eingaben.' }, { status: 400 })
  }
  const entry = await db.recurringEntry.create({
    data: {
      organizationId: orgId,
      kind: p.kind,
      amount: p.amount,
      category: p.category,
      areaId: await safeAreaId(body?.areaId, orgId),
      vatRate: p.vatRate,
      vendor: p.vendor,
      description: p.description,
      interval: p.interval,
      nextRun: p.nextRun,
    },
  })
  return NextResponse.json({ success: true, data: entry })
}

export async function PUT(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)

  const body = await req.json().catch(() => null)
  const existing = await db.recurringEntry.findFirst({ where: { id: body?.id, organizationId: orgId ?? '' } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  // Nur-Toggle (active) oder Vollupdate
  if (typeof body?.active === 'boolean' && Object.keys(body).length === 2) {
    const updated = await db.recurringEntry.update({ where: { id: existing.id }, data: { active: body.active } })
    return NextResponse.json({ success: true, data: updated })
  }

  const p = parseBody(body)
  if (!p.kind || !p.category || !p.description || !p.interval || !Number.isFinite(p.amount) || p.amount <= 0 || Number.isNaN(p.nextRun.getTime())) {
    return NextResponse.json({ error: 'Ungültige Eingaben.' }, { status: 400 })
  }
  const updated = await db.recurringEntry.update({
    where: { id: existing.id },
    data: {
      kind: p.kind,
      amount: p.amount,
      category: p.category,
      areaId: await safeAreaId(body?.areaId, orgId ?? ''),
      vatRate: p.vatRate,
      vendor: p.vendor,
      description: p.description,
      interval: p.interval,
      nextRun: p.nextRun,
      active: typeof body?.active === 'boolean' ? body.active : undefined,
    },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.recurringEntry.deleteMany({ where: { id, organizationId: orgId ?? '' } })
  return NextResponse.json({ success: true })
}
