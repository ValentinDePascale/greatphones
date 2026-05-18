import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
