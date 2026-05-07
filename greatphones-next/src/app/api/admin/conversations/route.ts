import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const adminId = searchParams.get('adminId')

    const where: any = {}
    if (status) where.status = status
    if (adminId) where.adminId = adminId

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, avatar: true }
        },
        admin: {
          select: { name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMsgAt: 'desc' }
    })

    return NextResponse.json(conversations, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Error fetching admin conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversationId, adminId, action } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 })
    }

    if (action === 'assign') {
      if (!adminId) {
        return NextResponse.json({ error: 'adminId requerido' }, { status: 400 })
      }

      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          adminId,
          status: 'OPEN'
        },
        include: {
          admin: {
            select: { name: true, email: true }
          }
        }
      })

      return NextResponse.json(conversation)
    }

    if (action === 'close') {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      })

      return NextResponse.json(conversation)
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
