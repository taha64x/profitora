import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import type { TokenPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET ist nicht gesetzt. Bitte .env konfigurieren.')
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as unknown as number })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function setAuthCookie(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export function clearAuthCookie() {
  cookies().set('auth_token', '', { maxAge: 0, path: '/' })
}

/**
 * Eingeloggten Nutzer aus dem JWT lesen UND gegen die aktuelle tokenVersion
 * prüfen — nach einem Passwort-Reset (Version +1) sind alle älteren Sessions
 * sofort ungültig (Session-Fixation-Schutz). Tokens ohne pv-Claim (Altbestand
 * vor diesem Update) gelten nur, solange die Version noch 0 ist.
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = cookies().get('auth_token')?.value
  if (!token) return null
  try {
    const payload = verifyToken(token)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true },
    })
    if (!user) return null
    if ((payload.pv ?? 0) !== user.tokenVersion) return null
    return payload
  } catch {
    return null
  }
}
