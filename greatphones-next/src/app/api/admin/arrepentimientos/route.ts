import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'



export async function GET(request: Request) {
  try {
    await requireAdmin(request)
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
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { id, estado } = body

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    const validStates = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO']
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
