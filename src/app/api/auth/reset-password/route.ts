import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!token) return NextResponse.json({ error: 'Ungültiger Link.' }, { status: 400 })
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const entry = await db.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!entry || entry.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Fordern Sie einen neuen an.' },
        { status: 400 },
      )
    }

    await db.$transaction([
      db.user.update({
        where: { id: entry.userId },
        data: {
          passwordHash: await hashPassword(password),
          // Alle bestehenden Sessions sofort invalidieren (Session-Fixation-Schutz):
          // getCurrentUser() vergleicht den pv-Claim mit dieser Version.
          tokenVersion: { increment: 1 },
        },
      }),
      db.passwordResetToken.deleteMany({ where: { userId: entry.userId } }),
    ])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Zurücksetzen fehlgeschlagen.' }, { status: 500 })
  }
}
