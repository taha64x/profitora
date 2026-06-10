import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const body = await req.json() as { uploadId?: string; mapping?: Record<string, string> }
    const { uploadId, mapping } = body

    if (!uploadId || typeof mapping !== 'object') {
      return NextResponse.json({ error: 'uploadId und mapping sind erforderlich.' }, { status: 400 })
    }

    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      include: { organization: { include: { members: true } } },
    })

    if (!upload) return NextResponse.json({ error: 'Datei nicht gefunden.' }, { status: 404 })

    const isMember = upload.organization.members.some((m) => m.userId === user.userId)
    if (!isMember) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    await db.upload.update({
      where: { id: uploadId },
      data: { columnMapping: mapping },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[column-mapping]', err)
    return NextResponse.json({ error: 'Spalten-Zuordnung konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
