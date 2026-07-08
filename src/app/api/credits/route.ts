export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/** Analyse-Guthaben der eigenen Organisation (für Dashboard/Neue-Analyse-Seite) */
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: { include: { subscription: true } } },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const sub = membership.organization.subscription
    return NextResponse.json({
      credits: sub?.analysisCredits ?? 0,
      planName: sub?.planName ?? 'free',
    })
  } catch (err) {
    console.error('[credits]', err)
    return NextResponse.json({ error: 'Guthaben konnte nicht geladen werden.' }, { status: 500 })
  }
}
