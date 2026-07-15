export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: true },
    })

    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

    const { organization: org } = membership
    return NextResponse.json({
      id: org.id,
      name: org.name,
      businessType: org.businessType,
      unitCount: org.unitCount,
      unitLabel: org.unitLabel,
      city: org.city,
    })
  } catch (err) {
    console.error('[organization]', err)
    return NextResponse.json({ error: 'Serverfehler.' }, { status: 500 })
  }
}
