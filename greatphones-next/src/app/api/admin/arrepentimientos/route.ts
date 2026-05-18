import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) }
  return { userId }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  try {
    const arrepentimientos = await prisma.arrepentimiento.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            code: true,
            total: true,
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(arrepentimientos, {
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })
  } catch (error) {
    console.error('[ADMIN ARREPENTIMIENTOS] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener arrepentimientos' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  try {
    const body = await request.json()
    const { id, estado } = body

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    const validStates = ['PENDIENTE', 'EN PROCESO', 'RESUELTO', 'RECHAZADO']
    if (!validStates.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    const updated = await prisma.arrepentimiento.update({
      where: { id },
      data: { estado }
    })

    return NextResponse.json({
      success: true,
      message: 'Estado actualizado',
      data: updated
    }, {
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })
  } catch (error) {
    console.error('[ADMIN ARREPENTIMIENTOS] PATCH Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}
