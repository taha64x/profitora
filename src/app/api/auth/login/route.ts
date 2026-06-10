import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.' },
      { status: 429 }
    )
  }

  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 })
    }

    const membership = await db.organizationMember.findFirst({ where: { userId: user.id } })
    const token = signToken({ userId: user.id, email: user.email, organizationId: membership?.organizationId })
    setAuthCookie(token)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen.' }, { status: 500 })
  }
}
