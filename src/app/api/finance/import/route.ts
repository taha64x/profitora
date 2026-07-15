import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { importHash } from '@/lib/import-hash'

interface ImportRow {
  date: string        // ISO
  amount: number      // absolut, > 0
  description: string
  vendor?: string
}

const MAX_ROWS = 2000

// POST { kind: 'expense'|'revenue', rows: ImportRow[], defaults: { category, areaId?, vatRate? } }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (!m) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const orgId = m.organizationId

  const body = await req.json().catch(() => null)
  const kind = body?.kind === 'revenue' ? 'revenue' : body?.kind === 'expense' ? 'expense' : null
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : []
  const category =
    typeof body?.defaults?.category === 'string' && body.defaults.category ? body.defaults.category : 'Sonstiges'
  let areaId: string | null =
    typeof body?.defaults?.areaId === 'string' && body.defaults.areaId ? body.defaults.areaId : null
  const vatRate = [0, 7, 19].includes(Number(body?.defaults?.vatRate)) ? Number(body.defaults.vatRate) : null
  if (!kind || rows.length === 0) return NextResponse.json({ error: 'Keine Zeilen übermittelt.' }, { status: 400 })
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Maximal ${MAX_ROWS} Zeilen pro Import.` }, { status: 400 })
  if (areaId) {
    const a = await db.area.findFirst({ where: { id: areaId, organizationId: orgId } })
    if (!a) areaId = null
  }

  const prepared = rows
    .map((r) => {
      const date = new Date(r.date)
      const amount = Math.abs(Number(r.amount))
      const description = String(r.description ?? '').slice(0, 300).trim()
      if (Number.isNaN(date.getTime()) || !Number.isFinite(amount) || amount <= 0 || !description) return null
      return {
        date,
        amount,
        description,
        vendor: r.vendor ? String(r.vendor).slice(0, 200) : null,
        hash: importHash(date, amount, description),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  const hashes = prepared.map((r) => r.hash)
  const existing =
    kind === 'expense'
      ? await db.expense.findMany({
          where: { organizationId: orgId, importHash: { in: hashes } },
          select: { importHash: true },
        })
      : await db.revenue.findMany({
          where: { organizationId: orgId, importHash: { in: hashes } },
          select: { importHash: true },
        })
  const known = new Set(existing.map((e) => e.importHash))
  const fresh = prepared.filter((r) => !known.has(r.hash))
  // Duplikate innerhalb derselben Datei ebenfalls nur einmal
  const seen = new Set<string>()
  const unique = fresh.filter((r) => (seen.has(r.hash) ? false : (seen.add(r.hash), true)))

  if (unique.length > 0) {
    const common = (r: (typeof unique)[number]) => ({
      organizationId: orgId,
      createdById: user.userId,
      date: r.date,
      category,
      areaId,
      vatRate,
      description: r.description,
      amount: r.amount,
      importHash: r.hash,
    })
    if (kind === 'expense') {
      await db.expense.createMany({ data: unique.map((r) => ({ ...common(r), vendor: r.vendor })) })
    } else {
      await db.revenue.createMany({ data: unique.map((r) => ({ ...common(r), customerOrSource: r.vendor })) })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      imported: unique.length,
      skippedDuplicates: prepared.length - unique.length,
      invalid: rows.length - prepared.length,
    },
  })
}
