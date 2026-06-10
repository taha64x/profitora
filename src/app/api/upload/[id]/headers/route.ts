import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const execFileAsync = promisify(execFile)

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

    const scriptPath = join(process.cwd(), 'python', 'analyze_csv.py')
    const { stdout } = await execFileAsync('python3', [
      scriptPath,
      '--mode', 'headers',
      '--file', upload.storagePath,
    ])

    const result = JSON.parse(stdout) as { success: boolean; columns?: string[]; error?: string }

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
