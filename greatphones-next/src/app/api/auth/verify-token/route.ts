import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'



export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: { select: { id: true, email: true, name: true, role: true } } }
    })

    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Token invalido o expirado' }, { status: 401 })
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
