import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateConversationSchema, formatZodError } from '@/lib/validations'
import { requireSession } from '@/lib/auth-guard'



export async function GET(request: Request) {
  try {
    const user = await requireSession(request)
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
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
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
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

    const user = await requireSession(request)
    const { type, subject, firstMessage } = validation.data

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        type,
        subject,
        ...(firstMessage && {
          messages: {
            create: {
              from: user.id,
              fromUserId: user.id,
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
