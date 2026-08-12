import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSelfOrAdmin, handleRouteError } from '@/lib/auth-guard'
import { ALLOWED_ORIGINS } from '@/config'



export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 })
    }

    await requireSelfOrAdmin(userId, request)
    await prisma.user.delete({
      where: { id: userId }
    })
    console.log('[DELETE API] User deleted successfully')

    return NextResponse.json({ message: 'Cuenta eliminada' }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': request.headers.get('origin') || ALLOWED_ORIGINS[0] }
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
