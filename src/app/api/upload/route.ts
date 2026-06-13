import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { UploadCategory } from '@/types'

export const dynamic = 'force-dynamic'

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
const ALLOWED_MIME = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
]
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20')

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
    }

    const membership = await db.organizationMember.findFirst({ where: { userId: user.userId } })
    if (!membership) {
      return NextResponse.json({ error: 'Kein Hotel gefunden. Bitte zuerst Hotel anlegen.' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as UploadCategory | null

    if (!file) return NextResponse.json({ error: 'Keine Datei gefunden.' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Kategorie fehlt.' }, { status: 400 })

    const ext = extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Nur CSV und Excel-Dateien erlaubt. Erhalten: ${ext}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Datei zu groß. Maximum: ${MAX_SIZE_MB} MB` }, { status: 400 })
    }

    const safeFilename = `${randomUUID()}${ext}`
    let storagePath: string

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Produktion / Vercel: Datei in Vercel Blob ablegen.
      // Pfad ist durch die UUID nicht erratbar; die Python-Analyse liest die Datei
      // anschließend über diese URL.
      const blob = await put(`uploads/${safeFilename}`, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type || 'application/octet-stream',
      })
      storagePath = blob.url
    } else {
      // Lokale Entwicklung: ins lokale uploads/-Verzeichnis schreiben.
      const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
      await mkdir(uploadDir, { recursive: true })
      storagePath = join(uploadDir, safeFilename)
      const bytes = await file.arrayBuffer()
      await writeFile(storagePath, Buffer.from(bytes))
    }

    const upload = await db.upload.create({
      data: {
        filename: safeFilename,
        originalName: file.name,
        category,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath,
        organizationId: membership.organizationId,
        uploadedById: user.userId,
      },
    })

    return NextResponse.json({ success: true, upload })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({ where: { userId: user.userId } })
    if (!membership) return NextResponse.json({ uploads: [] })

    const uploads = await db.upload.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ uploads })
  } catch (err) {
    console.error('[upload GET]', err)
    return NextResponse.json({ error: 'Fehler beim Laden der Uploads.' }, { status: 500 })
  }
}
