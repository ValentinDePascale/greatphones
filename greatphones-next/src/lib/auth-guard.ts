import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getAuthenticatedUser(request?: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true }
    })
    if (user) return user
  }

  if (request) {
    const userId = request.headers.get('x-user-id')
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      })
      if (user) return user
    }
  }

  return null
}

export async function requireSession(request?: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw { status: 401, message: 'No autenticado' }
  }
  return user
}

export async function requireAdmin(request?: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw { status: 401, message: 'No autenticado' }
  }
  if (user.role !== 'ADMIN') {
    throw { status: 403, message: 'Acceso denegado' }
  }
  return user
}

export async function requireSelfOrAdmin(userId: string, request?: Request) {
  const user = await requireSession(request)
  if (user.id !== userId && user.role !== 'ADMIN') {
    throw { status: 403, message: 'No tienes permiso para modificar este recurso' }
  }
  return user
}
