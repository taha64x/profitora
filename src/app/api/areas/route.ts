import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { areaDefaultsFor } from '@/lib/areas'

async function orgFor(userId: string) {
  const m = await db.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { id: true, businessType: true } } },
  })
  return m?.organization ?? null
}

// GET: Bereiche der Org; seedet Branchen-Defaults beim ersten Aufruf.
export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  let areas = await db.area.findMany({ where: { organizationId: org.id }, orderBy: { sortOrder: 'asc' } })
  if (areas.length === 0) {
    const defaults = areaDefaultsFor(org.businessType)
    await db.area.createMany({
      data: defaults.map((name, i) => ({ organizationId: org.id, name, sortOrder: i })),
      skipDuplicates: true,
    })
    areas = await db.area.findMany({ where: { organizationId: org.id }, orderBy: { sortOrder: 'asc' } })
  }
  return NextResponse.json({ success: true, data: areas })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 40) return NextResponse.json({ error: 'Ungültiger Name.' }, { status: 400 })
  const count = await db.area.count({ where: { organizationId: org.id } })
  if (count >= 20) return NextResponse.json({ error: 'Maximal 20 Bereiche.' }, { status: 400 })
  try {
    const area = await db.area.create({ data: { organizationId: org.id, name, sortOrder: count } })
    return NextResponse.json({ success: true, data: area })
  } catch {
    return NextResponse.json({ error: 'Bereich existiert bereits.' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })
  await db.area.deleteMany({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
}
