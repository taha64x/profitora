import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({ where: { userId: user.userId } })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen.' }, { status: 400 })

    const targets = await db.monthlyTarget.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return NextResponse.json({ targets })
  } catch (err) {
    console.error('[monthly-targets GET]', err)
    return NextResponse.json({ error: 'Fehler.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({ where: { userId: user.userId } })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen.' }, { status: 400 })

    const body = await req.json()
    const { year, month, revenueTarget, expenseTarget, note } = body

    if (!year || !month) return NextResponse.json({ error: 'Jahr und Monat sind Pflicht.' }, { status: 400 })

    const target = await db.monthlyTarget.upsert({
      where: { organizationId_year_month: { organizationId: membership.organizationId, year, month } },
      create: {
        organizationId: membership.organizationId,
        year,
        month,
        revenueTarget: revenueTarget ?? null,
        expenseTarget: expenseTarget ?? null,
        note: note ?? null,
      },
      update: {
        revenueTarget: revenueTarget ?? null,
        expenseTarget: expenseTarget ?? null,
        note: note ?? null,
      },
    })

    return NextResponse.json({ success: true, target })
  } catch (err) {
    console.error('[monthly-targets POST]', err)
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 })

    const membership = await db.organizationMember.findFirst({ where: { userId: user.userId } })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen.' }, { status: 400 })

    await db.monthlyTarget.deleteMany({
      where: { id, organizationId: membership.organizationId },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[monthly-targets DELETE]', err)
    return NextResponse.json({ error: 'Fehler.' }, { status: 500 })
  }
}
