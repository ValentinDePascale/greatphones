import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Cuenta eliminada' }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 })
  }
}