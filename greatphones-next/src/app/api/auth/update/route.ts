import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, phone } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name,
        phone: phone
      }
    })

    return NextResponse.json({ 
      message: 'Usuario actualizado',
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone }
    }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}