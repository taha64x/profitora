import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrgContext, shiftsBlocked, shiftsForbiddenResponse } from '@/lib/entitlements-server'

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const templates = await db.shiftTemplate.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { startMin: 'asc' },
  })
  return NextResponse.json({ success: true, data: templates })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 60) : ''
  const startMin = Number(body?.startMin)
  const endMin = Number(body?.endMin)
  if (!label || !Number.isInteger(startMin) || !Number.isInteger(endMin) || startMin < 0 || endMin > 1440 || endMin <= startMin) {
    return NextResponse.json({ error: 'Ungültige Vorlage.' }, { status: 400 })
  }
  const count = await db.shiftTemplate.count({ where: { organizationId: ctx.organizationId } })
  if (count >= 12) return NextResponse.json({ error: 'Maximal 12 Vorlagen.' }, { status: 400 })
  const template = await db.shiftTemplate.create({
    data: { organizationId: ctx.organizationId, label, startMin, endMin },
  })
  return NextResponse.json({ success: true, data: template })
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })
  await db.shiftTemplate.deleteMany({ where: { id, organizationId: ctx.organizationId } })
  return NextResponse.json({ success: true })
}
