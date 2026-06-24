import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitUnreadUpdate } from '@/lib/socket'

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json().catch(() => ({}))
    const readerId = body.readerId

    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        readAt: null
      },
      data: {
        readAt: new Date(),
        status: 'READ'
      }
    })

    // Determine which counter to reset based on who is reading
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true, adminId: true }
    })

    const updateData: any = { unread: 0 }

    if (conversation) {
      if (readerId === conversation.userId) {
        // User is reading -> reset unreadByUser
        updateData.unreadByUser = 0
      } else if (readerId === conversation.adminId || readerId === 'admin') {
        // Admin is reading -> reset unreadByAdmin
        updateData.unreadByAdmin = 0
      } else {
        // Fallback: reset both
        updateData.unreadByUser = 0
        updateData.unreadByAdmin = 0
      }
    }

    await prisma.conversation.update({
      where: { id },
      data: updateData
    })

    // Emit unreadUpdate so badges update instantly
    if (readerId) {
      emitUnreadUpdate(readerId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}
