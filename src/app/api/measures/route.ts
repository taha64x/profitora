import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { featureBlocked, featureForbiddenResponse, getOrgContext } from '@/lib/entitlements-server'

const STATUSES = new Set(['OPEN', 'IMPLEMENTED', 'DISCARDED'])

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await featureBlocked('measures')) return featureForbiddenResponse('Der Maßnahmen-Tracker')
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const measures = await db.measure.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 300,
  })
  return NextResponse.json({ success: true, data: measures })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await featureBlocked('measures')) return featureForbiddenResponse('Der Maßnahmen-Tracker')
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : ''
  if (!title) return NextResponse.json({ error: 'Titel fehlt.' }, { status: 400 })
  const savings = Number(body?.potentialSavingsCents)
  const measure = await db.measure.create({
    data: {
      organizationId: ctx.organizationId,
      title,
      description: typeof body?.description === 'string' ? body.description.slice(0, 1000) || null : null,
      potentialSavingsCents: Number.isFinite(savings) && savings > 0 ? Math.round(savings) : null,
      reportId: typeof body?.reportId === 'string' ? body.reportId : null,
    },
  })
  return NextResponse.json({ success: true, data: measure })
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await featureBlocked('measures')) return featureForbiddenResponse('Der Maßnahmen-Tracker')
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const existing = await db.measure.findFirst({ where: { id: body?.id, organizationId: ctx.organizationId } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const status = STATUSES.has(body?.status) ? (body.status as string) : undefined
  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : undefined
  const savings = Number(body?.potentialSavingsCents)
  const updated = await db.measure.update({
    where: { id: existing.id },
    data: {
      title,
      description: typeof body?.description === 'string' ? body.description.slice(0, 1000) || null : undefined,
      potentialSavingsCents: body?.potentialSavingsCents !== undefined
        ? (Number.isFinite(savings) && savings > 0 ? Math.round(savings) : null)
        : undefined,
      status,
      implementedAt: status === 'IMPLEMENTED' ? existing.implementedAt ?? new Date() : status ? null : undefined,
    },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await featureBlocked('measures')) return featureForbiddenResponse('Der Maßnahmen-Tracker')
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.measure.deleteMany({ where: { id, organizationId: ctx.organizationId } })
  return NextResponse.json({ success: true })
}
