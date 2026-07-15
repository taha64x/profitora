import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { BUSINESS_TYPES } from '@/types'
import { rateLimit } from '@/lib/ratelimit'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Zu viele Registrierungsversuche. Bitte warten Sie eine Stunde.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { name, email, password, organizationName, businessType, unitCount } = body

    if (!email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'E-Mail, Passwort und Unternehmensname sind erforderlich.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen haben.' },
        { status: 400 }
      )
    }

    const validType = BUSINESS_TYPES.find((b) => b.value === businessType)
    const resolvedType = validType?.value ?? 'other'
    const unitLabel = validType?.unitLabel ?? 'Einheiten'

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        memberships: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: organizationName,
                businessType: resolvedType,
                unitCount: unitCount ? parseInt(String(unitCount)) : null,
                unitLabel,
              },
            },
          },
        },
      },
      include: { memberships: { include: { organization: true } } },
    })

    const org = user.memberships[0]?.organization
    const token = signToken({ userId: user.id, email: user.email, organizationId: org?.id, pv: user.tokenVersion })
    setAuthCookie(token)

    sendWelcomeEmail(user.email, user.name ?? '', org?.name ?? organizationName).catch(console.error)

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 })
  }
}
