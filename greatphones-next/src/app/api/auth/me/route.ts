import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookies, createSessionCookie, clearSessionCookie } from '@/lib/session'

export async function GET(request: Request) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, name: true, phone: true, dni: true, direccion: true, piso: true, cp: true, provincia: true, ciudad: true, role: true }
      })
      if (user) {
        const cookie = createSessionCookie(user.id, user.role)
        return NextResponse.json({ user }, {
          headers: { 'Set-Cookie': cookie }
        })
      }
    }

    // Try our JWT cookie
    const cookieHeader = request.headers.get('cookie')
    const sessionPayload = getSessionFromCookies(cookieHeader)
    if (sessionPayload) {
      const user = await prisma.user.findUnique({
        where: { id: sessionPayload.id },
        select: { id: true, email: true, name: true, phone: true, dni: true, direccion: true, piso: true, cp: true, provincia: true, ciudad: true, role: true }
      })
      if (user) {
        return NextResponse.json({ user })
      }
    }

    return NextResponse.json({ user: null }, { status: 401 })
  } catch (error) {
    console.error('[Me] Error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
