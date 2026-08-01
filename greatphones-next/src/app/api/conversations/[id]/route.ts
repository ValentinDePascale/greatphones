import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'



export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const user = await requireSession(request)
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, avatar: true }
        },
        admin: {
          select: { name: true, email: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    return NextResponse.json(conversation, {
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}
