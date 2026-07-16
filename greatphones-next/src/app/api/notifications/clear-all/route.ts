import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'

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
