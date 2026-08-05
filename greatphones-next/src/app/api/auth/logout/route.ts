import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value

  // Delete the session from the database
  if (nextAuthToken) {
    prisma.session.deleteMany({ where: { sessionToken: nextAuthToken } }).catch(() => {})
  }

  // Build Set-Cookie headers to clear ALL auth cookies
  const clearNextAuth = 'next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
  const clearNextAuthSecure = '__Secure-next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure'

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': [clearSessionCookie(), clearNextAuth, clearNextAuthSecure].join(', '),
      },
    }
  )
}
