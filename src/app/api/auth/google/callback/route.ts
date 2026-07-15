export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

interface GoogleIdTokenPayload {
  email?: string
  email_verified?: boolean
  name?: string
}

/** Payload eines JWT ohne Signaturprüfung lesen. Sicher NUR hier: Das id_token
 *  kommt direkt aus dem server-seitigen Code-Austausch mit Google über TLS –
 *  die Herkunft ist damit bereits verbürgt (Standard beim Confidential Client). */
function decodeJwtPayload(token: string): GoogleIdTokenPayload {
  const payload = token.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!appUrl || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=google-config', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const stateCookie = cookies().get('google_oauth_state')?.value
  cookies().set('google_oauth_state', '', { maxAge: 0, path: '/' })

  const [expectedState, plan = ''] = (stateCookie ?? '').split(':')
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/login?error=google-state', req.url))
  }

  try {
    // Code gegen Tokens tauschen (direkt bei Google, TLS)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[google-callback] Token-Austausch fehlgeschlagen:', tokenData)
      return NextResponse.redirect(new URL('/login?error=google-token', req.url))
    }

    const profile = decodeJwtPayload(tokenData.id_token)
    if (!profile.email || profile.email_verified !== true) {
      return NextResponse.redirect(new URL('/login?error=google-email', req.url))
    }
    const email = profile.email.toLowerCase()

    let user = await db.user.findUnique({
      where: { email },
      include: { memberships: true },
    })
    let isNew = false

    if (!user) {
      isNew = true
      // Google-Signup: Konto ohne nutzbares Passwort (zufälliger Hash) und
      // Platzhalter-Organisation – Details ergänzt das Onboarding.
      user = await db.user.create({
        data: {
          email,
          name: profile.name ?? null,
          passwordHash: await hashPassword(randomUUID()),
          memberships: {
            create: {
              role: 'OWNER',
              organization: {
                create: {
                  name: profile.name ? `${profile.name} – Unternehmen` : 'Mein Unternehmen',
                  businessType: 'other',
                  unitLabel: 'Einheiten',
                },
              },
            },
          },
        },
        include: { memberships: true },
      })
      sendWelcomeEmail(email, profile.name ?? '', 'Ihr Unternehmen').catch(console.error)
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      organizationId: user.memberships[0]?.organizationId,
      pv: user.tokenVersion,
    })
    setAuthCookie(token)

    // Ziel: Abo-Intention → Tarifseite mit Hinweis-Banner; gewähltes Paket →
    // Kaufseite (dort liegt die Widerrufs-Zustimmung); neuer Nutzer →
    // Onboarding; sonst Dashboard.
    const target =
      plan === 'abo'
        ? '/dashboard/subscription?upgrade=1'
        : plan
          ? '/dashboard/subscription'
          : isNew
            ? '/onboarding'
            : '/dashboard'
    return NextResponse.redirect(new URL(target, appUrl))
  } catch (err) {
    console.error('[google-callback]', err)
    return NextResponse.redirect(new URL('/login?error=google', req.url))
  }
}
