import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('[DELETE API] Received request for userId:', userId)

    if (!userId) {
      console.log('[DELETE API] No userId provided')
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 })
    }

    console.log('[DELETE API] Attempting to delete user:', userId)
    await prisma.user.delete({
      where: { id: userId }
    })
    console.log('[DELETE API] User deleted successfully')

    return NextResponse.json({ message: 'Cuenta eliminada' }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('[DELETE API] Delete account error:', error)
    return NextResponse.json({ error: 'Error al eliminar cuenta: ' + (error as Error).message }, { status: 500 })
  }
}