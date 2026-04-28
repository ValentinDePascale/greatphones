import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
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
      headers: { 'Access-Control-Allow-Origin': '*' }
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
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('[ADMIN ARREPENTIMIENTOS] PATCH Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}