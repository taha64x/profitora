import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { presignBlobGetUrl } from '@/lib/blob'

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf'])
const MAX_BYTES = 10 * 1024 * 1024

async function orgIdFor(userId: string): Promise<string | null> {
  const m = await db.organizationMember.findFirst({ where: { userId } })
  return m?.organizationId ?? null
}

// POST: Beleg hochladen → { path, name } für receiptPath/receiptName am Eintrag.
export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await orgIdFor(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Beleg größer als 10 MB.' }, { status: 400 })
  const ext = ('.' + (file.name.split('.').pop() ?? '')).toLowerCase()
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: 'Nur JPG, PNG, WebP oder PDF.' }, { status: 400 })

  const pathname = `receipts/${orgId}/${randomUUID()}${ext}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    await put(pathname, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: file.type || 'application/octet-stream',
    })
  } else {
    // Lokale Entwicklung ohne Blob-Token (Muster wie /api/upload)
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const dir = path.join(process.env.UPLOAD_DIR ?? './uploads', 'receipts', orgId)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, pathname.split('/').pop()!), Buffer.from(await file.arrayBuffer()))
  }
  return NextResponse.json({ success: true, data: { path: pathname, name: file.name } })
}

// GET ?kind=expense|revenue&id=… : Org-geprüfter Zugriff auf den Beleg.
export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  const orgId = await orgIdFor(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const id = url.searchParams.get('id') ?? ''
  const entry =
    kind === 'expense'
      ? await db.expense.findFirst({ where: { id, organizationId: orgId }, select: { receiptPath: true } })
      : kind === 'revenue'
        ? await db.revenue.findFirst({ where: { id, organizationId: orgId }, select: { receiptPath: true } })
        : null
  if (!entry?.receiptPath) return NextResponse.json({ error: 'Kein Beleg vorhanden.' }, { status: 404 })

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const signed = await presignBlobGetUrl(entry.receiptPath, 5 * 60 * 1000)
    return NextResponse.redirect(signed)
  }
  const path = await import('path')
  const { readFile } = await import('fs/promises')
  const filePath = path.join(process.env.UPLOAD_DIR ?? './uploads', entry.receiptPath)
  const buf = await readFile(filePath).catch(() => null)
  if (!buf) return NextResponse.json({ error: 'Beleg nicht gefunden.' }, { status: 404 })
  const mime = entry.receiptPath.endsWith('.pdf') ? 'application/pdf' : 'image/*'
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': mime } })
}
