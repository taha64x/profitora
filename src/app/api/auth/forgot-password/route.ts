import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

// Antwortet IMMER mit success — verrät nicht, ob eine E-Mail registriert ist
// (User-Enumeration-Schutz). Token: 32 Byte, 60 Minuten, nur als Hash in der DB.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })

    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      // Rate-Limit gegen Mail-Bombing: max. eine Reset-Mail pro Konto alle 5 Minuten.
      // Antwort bleibt success (kein Unterschied nach außen sichtbar).
      const recent = await db.passwordResetToken.findFirst({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      })
      if (recent) return NextResponse.json({ success: true })

      // Alte Tokens entwerten, damit immer nur der neueste Link gilt
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } })
      const token = randomBytes(32).toString('base64url')
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })
      await sendPasswordResetEmail(email, token).catch((err) =>
        console.error('[forgot-password] Mailversand fehlgeschlagen:', err),
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Anfrage fehlgeschlagen.' }, { status: 500 })
  }
}
