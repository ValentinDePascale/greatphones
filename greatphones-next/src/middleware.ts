import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteger rutas de admin
  if (pathname.startsWith('/admin')) {
    // Verificar si el usuario tiene sesión verificando las cookies
    const cookies = request.headers.get('cookie') || ''

    // Buscar cookies de sesión (pueden tener diferentes nombres)
    const hasSessionCookie =
      cookies.includes('next-auth.session-token') ||
      cookies.includes('__Secure-next-auth.session-token') ||
      cookies.includes('session') ||
      cookies.includes('token') ||
      cookies.includes('auth') ||
      cookies.includes('userId')

    if (!hasSessionCookie) {
      // Redirigir al login si no está autenticado
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // El servidor validará completamente el rol y acceso en el layout
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
