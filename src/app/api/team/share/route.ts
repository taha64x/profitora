import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOrgContext, shiftsBlocked, shiftsForbiddenResponse } from '@/lib/entitlements-server'

function newToken(): string {
  return randomBytes(24).toString('base64url')
}

function shareUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/plan/${token}`
}

// GET: liefert (erzeugt bei Bedarf) den öffentlichen Plan-Link der Org.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  let entry = await db.planShareToken.findUnique({ where: { organizationId: ctx.organizationId } })
  if (!entry) {
    entry = await db.planShareToken.create({
      data: { organizationId: ctx.organizationId, token: newToken() },
    })
  }
  return NextResponse.json({ success: true, data: { url: shareUrl(entry.token), active: entry.active } })
}

// POST { regenerate: true } → alter Link wird ungültig, neuer Token.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await shiftsBlocked()) return shiftsForbiddenResponse()
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (body?.regenerate !== true) return NextResponse.json({ error: 'regenerate fehlt.' }, { status: 400 })

  const entry = await db.planShareToken.upsert({
    where: { organizationId: ctx.organizationId },
    create: { organizationId: ctx.organizationId, token: newToken() },
    update: { token: newToken(), active: true },
  })
  return NextResponse.json({ success: true, data: { url: shareUrl(entry.token), active: entry.active } })
}
