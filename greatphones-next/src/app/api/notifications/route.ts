import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unread') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const countOnly = searchParams.get('countOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const where: any = { userId }

    if (unreadOnly) {
      where.read = false
    }

    if (type) {
      where.type = type
    }

    if (countOnly) {
      const count = await prisma.notification.count({ where })
      return NextResponse.json({ count })
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        conversation: {
          select: {
            id: true,
            type: true,
            subject: true,
            status: true
          }
        },
        message: {
          select: {
            id: true,
            text: true,
            imageUrl: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, type, title, text, conversationId, messageId } = body

    if (!userId || !type || !title || !text) {
      return NextResponse.json({ error: 'Campos requeridos: userId, type, title, text' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        text,
        conversationId: conversationId || null,
        messageId: messageId || null
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
