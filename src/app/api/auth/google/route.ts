export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Schritt 1 des Google-Logins: Redirect zu Googles OAuth-Consent.
// Aktivierung: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (Server) und
// NEXT_PUBLIC_GOOGLE_LOGIN=1 (zeigt den Button). Redirect-URI in der
// Google Cloud Console: <APP_URL>/api/auth/google/callback
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !appUrl) {
    return NextResponse.redirect(new URL('/login?error=google-config', req.url))
  }

  // Gewähltes Analyse-Paket (von /register?plan=…) durch den OAuth-Flow reichen
  const plan = req.nextUrl.searchParams.get('plan') ?? ''
  const state = randomBytes(16).toString('hex')

  // CSRF-Schutz: State-Nonce in httpOnly-Cookie, Abgleich im Callback
  cookies().set('google_oauth_state', `${state}:${plan}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
