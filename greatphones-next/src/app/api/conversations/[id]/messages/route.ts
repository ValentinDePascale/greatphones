import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SendMessageSchema, formatZodError } from '@/lib/validations'
import { sendNewMessageToAdminEmail, sendAdminReplyEmail } from '@/lib/email'

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
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
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

    // Get conversation with user and admin details
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Determine if sender is admin or user
    const senderUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    const isAdminSender = senderUser?.role === 'ADMIN' || userId === 'admin';
    const isUserSender = conversation.userId === userId;

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

    // Update conversation with direction-aware unread counters
    const updateData: any = {
      lastMsgAt: new Date(),
      unread: { increment: 1 }
    }

    if (isUserSender) {
      // User sent message -> increment admin unread
      updateData.unreadByAdmin = { increment: 1 }
    } else if (isAdminSender) {
      // Admin sent message -> increment user unread
      updateData.unreadByUser = { increment: 1 }
    }

    await prisma.conversation.update({
      where: { id },
      data: updateData
    })

    // Create notification for the recipient
    if (isUserSender) {
      // Find or use existing admin for this conversation
      let targetAdmin = conversation.admin;
      if (!targetAdmin) {
        // Auto-assign first available admin
        const autoAdmin = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true }
        });
        if (autoAdmin) {
          targetAdmin = autoAdmin;
          await prisma.conversation.update({
            where: { id },
            data: { adminId: autoAdmin.id }
          });
        }
      }

      if (targetAdmin) {
        // Notify admin about new message from user
        await prisma.notification.create({
          data: {
            userId: targetAdmin.id,
            type: 'MESSAGE',
            title: 'Nuevo mensaje',
            text: `${conversation.user.name || 'Un usuario'} te ha enviado un mensaje`,
            conversationId: id,
            messageId: message.id
          }
        });

        // Send email to admin
        try {
          await sendNewMessageToAdminEmail({
            adminEmail: targetAdmin.email || process.env.EMAIL_USER || 'contacto@greatphones.com.ar',
            userName: conversation.user.name || 'Usuario',
            messageText: text || '(imagen)',
            conversationId: id,
            conversationType: conversation.type
          });
        } catch (emailError) {
          console.error('[Messages] Error sending email to admin:', emailError);
        }
      }
    } else if (isAdminSender) {
      // Notify user about admin reply
      await prisma.notification.create({
        data: {
          userId: conversation.userId,
          type: 'MESSAGE',
          title: 'Nuevo mensaje del administrador',
          text: 'Tienes un nuevo mensaje del administrador',
          conversationId: id,
          messageId: message.id
        }
      })

      // Send email to user
      try {
        if (conversation.user.email) {
          await sendAdminReplyEmail({
            userEmail: conversation.user.email,
            userName: conversation.user.name || 'Usuario',
            adminName: 'Great Phones',
            messageText: text || '(imagen)',
            conversationId: id
          })
        }
      } catch (emailError) {
        console.error('[Messages] Error sending email to user:', emailError)
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
