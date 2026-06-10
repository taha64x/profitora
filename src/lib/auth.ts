import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
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

export function getCurrentUser(): TokenPayload | null {
  const token = cookies().get('auth_token')?.value
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}
