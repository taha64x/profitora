import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface Params {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const report = await db.analysisReport.findUnique({
      where: { id: params.id },
      include: { organization: true },
    })

    if (!report) return NextResponse.json({ error: 'Bericht nicht gefunden.' }, { status: 404 })

    const member = await db.organizationMember.findFirst({
      where: { userId: user.userId, organizationId: report.organizationId },
    })
    if (!member) return NextResponse.json({ error: 'Zugriff verweigert.' }, { status: 403 })

    return NextResponse.json({ report })
  } catch (err) {
    console.error('[report GET]', err)
    return NextResponse.json({ error: 'Fehler beim Laden des Berichts.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const report = await db.analysisReport.findUnique({ where: { id: params.id } })
    if (!report) return NextResponse.json({ error: 'Bericht nicht gefunden.' }, { status: 404 })

    const member = await db.organizationMember.findFirst({
      where: { userId: user.userId, organizationId: report.organizationId, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

    await db.analysisReport.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[report DELETE]', err)
    return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 })
  }
}
