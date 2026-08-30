import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteger rutas de admin
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    // Verificar si hay sesión de NextAuth o de la SPA existente
    const hasSessionToken = token || request.cookies.has('session') || request.cookies.has('token')

    if (!hasSessionToken) {
      // Redirigir al login si no está autenticado
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar que el usuario sea admin (esta verificación se completa en el layout del servidor)
    // El servidor va a validar completamente el rol en cada ruta
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
