import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'



export async function POST(request: Request) {
  try {
    const user = await requireSession(request)

    await prisma.notification.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
  }
}
