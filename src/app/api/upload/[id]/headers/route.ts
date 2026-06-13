import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getColumnHeaders } from '@/lib/analyze-engine'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const upload = await db.upload.findUnique({
      where: { id: params.id },
      include: { organization: { include: { members: true } } },
    })

    if (!upload) return NextResponse.json({ error: 'Datei nicht gefunden.' }, { status: 404 })

    const isMember = upload.organization.members.some((m) => m.userId === user.userId)
    if (!isMember) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const result = await getColumnHeaders(upload.storagePath)

    if (!result.success || !result.columns) {
      return NextResponse.json(
        { error: result.error || 'Spalten konnten nicht gelesen werden.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      columns: result.columns,
      existingMapping: upload.columnMapping ?? null,
      category: upload.category,
      originalName: upload.originalName,
    })
  } catch (err) {
    console.error('[upload/headers]', err)
    return NextResponse.json({ error: 'Fehler beim Lesen der Spalten.' }, { status: 500 })
  }
}
