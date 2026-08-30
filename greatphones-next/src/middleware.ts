import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/config'

/**
 * Pre-filtro liviano para /admin: solo comprueba que exista una cookie de
 * sesión con el nombre exacto esperado (gp-session, o las de NextAuth).
 * NO valida firma ni rol — eso es responsabilidad de requireAdmin() en el
 * layout del servidor, que sí verifica la firma HMAC y el rol ADMIN contra
 * la base de datos. Este chequeo solo evita que pedidos sin ninguna cookie
 * de sesión lleguen a renderizar el layout.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
