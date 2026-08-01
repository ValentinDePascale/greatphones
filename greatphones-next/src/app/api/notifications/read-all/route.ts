import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'



export async function POST(request: Request) {
  try {
    const user = await requireSession(request)

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
