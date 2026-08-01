import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'



export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const adminId = searchParams.get('adminId')
    const limit = parseInt(searchParams.get('limit') || '50')

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
      orderBy: { lastMsgAt: 'desc' },
      take: Math.min(limit, 100),
    })

    return NextResponse.json(conversations, {
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })
  } catch (error) {
    console.error('Error fetching admin conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
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

    if (action === 'delete') {
      // Delete all messages first
      await prisma.message.deleteMany({
        where: { conversationId }
      })

      // Delete the conversation
      await prisma.conversation.delete({
        where: { id: conversationId }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
