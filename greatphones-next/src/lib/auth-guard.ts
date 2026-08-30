import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookies } from '@/lib/session'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'AuthError'
  }
}

async function getAuthenticatedUser(request?: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    })
    if (user) return user
  }

  if (request) {
    const cookieHeader = request.headers.get('cookie')
    const sessionPayload = getSessionFromCookies(cookieHeader)
    if (sessionPayload) {
      const user = await prisma.user.findUnique({
        where: { id: sessionPayload.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          dni: true,
          direccion: true,
          piso: true,
          cp: true,
          provincia: true,
          ciudad: true,
          role: true,
        },
      })
      if (user) return user
    }
  }

  return null
}

export async function requireSession(request?: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw new AuthError('No autenticado', 401)
  }
  return user
}

export async function requireAdmin(request?: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw new AuthError('No autenticado. Por favor, inicia sesión.', 401)
  }
  if (user.role !== 'ADMIN') {
    throw new AuthError('No tienes permiso para acceder al panel de administración', 403)
  }
  return user
}

export async function requireSelfOrAdmin(userId: string, request?: Request) {
  const user = await requireSession(request)
  if (user.id !== userId && user.role !== 'ADMIN') {
    throw new AuthError('No tienes permiso para modificar este recurso', 403)
  }
  return user
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('Route error:', error)
  return NextResponse.json({ error: 'Error interno' }, { status: 500 })
}
