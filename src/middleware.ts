import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/upload', '/report', '/organization']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Öffentlicher Beispielbericht – muss ohne Login sichtbar sein (Vertrauens-/
  // Conversion-Hebel). Sonst würde der '/report'-Schutz auch /report/example sperren.
  if (pathname === '/report/example') return NextResponse.next()

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token-Gültigkeit wird in den API-Routen bzw. Server-Komponenten geprüft
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/report/:path*',
    '/organization/:path*',
  ],
}
