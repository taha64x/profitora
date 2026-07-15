import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'

async function getOrgId(userId: string) {
  const m = await db.organizationMember.findFirst({ where: { userId } })
  return m?.organizationId ?? null
}

export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const category = searchParams.get('category')

  const where: Record<string, unknown> = { organizationId: orgId }
  if (category) where.category = category
  if (month) {
    const [y, m2] = month.split('-').map(Number)
    where.date = { gte: new Date(y, m2 - 1, 1), lt: new Date(y, m2, 1) }
  }

  const revenues = await db.revenue.findMany({ where, orderBy: { date: 'desc' } })
  return NextResponse.json({ success: true, data: revenues })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json()
  const revenue = await db.revenue.create({
    data: {
      organizationId:     orgId,
      createdById:        user.userId,
      date:               new Date(body.date),
      category:           body.category,
      description:        body.description,
      amount:             Number(body.amount),
      currency:           body.currency ?? 'EUR',
      customerOrSource:   body.customerOrSource ?? null,
      paymentStatus:      body.paymentStatus ?? 'paid',
      isRecurring:        body.isRecurring ?? false,
      recurrenceInterval: body.recurrenceInterval ?? null,
      notes:              body.notes ?? null,
    },
  })
  return NextResponse.json({ success: true, data: revenue })
}

export async function PUT(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)

  const body = await req.json()
  const existing = await db.revenue.findFirst({ where: { id: body.id, organizationId: orgId ?? '' } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const updated = await db.revenue.update({
    where: { id: body.id },
    data: {
      date:               body.date ? new Date(body.date) : undefined,
      category:           body.category,
      description:        body.description,
      amount:             body.amount !== undefined ? Number(body.amount) : undefined,
      customerOrSource:   body.customerOrSource,
      paymentStatus:      body.paymentStatus,
      isRecurring:        body.isRecurring,
      recurrenceInterval: body.recurrenceInterval,
      notes:              body.notes,
    },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await getOrgId(user.userId)

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })

  const existing = await db.revenue.findFirst({ where: { id, organizationId: orgId ?? '' } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  await db.revenue.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
