import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
