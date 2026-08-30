import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isOriginAllowed, SESSION_COOKIE_NAME } from '@/config'
import { isAllowedRequestOrigin, isMutatingRequest } from '@/lib/request-guard'

const isDev = process.env.NODE_ENV !== 'production'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin') || ''

  // CSRF: reject cross-origin state-changing requests (browser sends Origin/Referer)
  if (isMutatingRequest(request.method) && !isAllowedRequestOrigin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Origen no permitido' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Pre-filtro de /admin: solo comprueba que exista una cookie de sesión con
  // el nombre exacto esperado (gp-session, o las de NextAuth). NO valida
  // firma ni rol — eso es responsabilidad de requireAdmin() en el layout del
  // servidor, que verifica la firma HMAC y el rol ADMIN contra la base de
  // datos. Este chequeo solo evita que pedidos sin ninguna cookie de sesión
  // lleguen a renderizar el layout.
  if (pathname.startsWith('/admin')) {
    const hasSessionCookie =
      request.cookies.has(SESSION_COOKIE_NAME) ||
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token')

    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = NextResponse.next()

  // Request ID for tracing
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  response.headers.set('X-Request-Id', requestId)

  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '0')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self)'
  )
  response.headers.set(
    'Content-Security-Policy',
    isDev
      ? // Dev: permitir todo para que el túnel funcione
        "default-src 'self' * data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' * https://cdn.socket.io https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' * https://fonts.googleapis.com; font-src 'self' * https://fonts.gstatic.com data:; img-src 'self' data: blob: *; connect-src 'self' * ws: wss:; frame-ancestors 'self' *; media-src 'self' * blob:; worker-src 'self' * blob:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://greatphones.onrender.com https://greatphones.com.ar https://www.greatphones.com.ar; frame-ancestors 'none'; media-src 'self' blob:; worker-src 'self' blob:;"
  )

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|api|favicon\\.ico).*)', '/api/:path*'],
}
