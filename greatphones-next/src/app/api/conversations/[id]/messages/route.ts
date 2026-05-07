import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SendMessageSchema, formatZodError } from '@/lib/validations'

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const query: any = {
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        fromUser: {
          select: { name: true, avatar: true }
        }
      }
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    }

    const messages = await prisma.message.findMany(query)

    return NextResponse.json(messages.reverse(), {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()

    const validation = SendMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }

    const { text, imageUrl, imageCaption } = validation.data
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        from: userId,
        fromUserId: userId,
        text: text || null,
        imageUrl: imageUrl || null,
        imageCaption: imageCaption || null
      },
      include: {
        fromUser: {
          select: { name: true, avatar: true }
        }
      }
    })

    // Update conversation lastMsgAt and unread count
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMsgAt: new Date(),
        unread: { increment: 1 }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
