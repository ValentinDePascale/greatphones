import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateConversationSchema, formatZodError } from '@/lib/validations'

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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        user: {
          select: { name: true, email: true, avatar: true }
        }
      },
      orderBy: { lastMsgAt: 'desc' }
    })

    return NextResponse.json(conversations, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = CreateConversationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }

    const { type, subject, firstMessage } = validation.data
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        type,
        subject,
        ...(firstMessage && {
          messages: {
            create: {
              from: userId,
              fromUserId: userId,
              text: firstMessage
            }
          }
        })
      },
      include: {
        messages: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
