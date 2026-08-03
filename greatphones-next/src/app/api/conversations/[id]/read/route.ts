import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitUnreadUpdate } from '@/lib/socket'
import { requireSession } from '@/lib/auth-guard'



export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const user = await requireSession(request)
    const readerId = user.id

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

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true, adminId: true }
    })

    const updateData: any = {}

    if (conversation) {
      if (readerId !== conversation.userId && readerId !== conversation.adminId && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      if (readerId === conversation.userId) {
        updateData.unreadByUser = 0
      } else if (readerId === conversation.adminId || user.role === 'ADMIN') {
        updateData.unreadByAdmin = 0
      } else {
        updateData.unreadByUser = 0
        updateData.unreadByAdmin = 0
      }
    }

    await prisma.conversation.update({
      where: { id },
      data: updateData
    })

    emitUnreadUpdate(readerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}
