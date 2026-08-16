import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { serveSpa } from '@/lib/spa-pages'
import { SESSION_COOKIE_NAME } from '@/config'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mi Cuenta — Great Phones', robots: { index: false, follow: false } }

export default async function Page() {
  const cookieStore = await cookies()
  // Aceptar tanto la cookie de NextAuth como la cookie legacy HMAC (gp-session).
  // Si gp-session existe, la sesión ya está validada por firma HMAC en getSessionFromCookies,
  // por eso acá solo verificamos que esté presente.
  const gpSession = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (gpSession) {
    return <div dangerouslySetInnerHTML={{ __html: serveSpa('cuenta') }} suppressHydrationWarning />
  }
  const token = cookieStore.get('__Secure-next-auth.session-token')?.value
    || cookieStore.get('next-auth.session-token')?.value
  if (!token) redirect('/login')
  const session = await prisma.session.findFirst({ where: { sessionToken: token, expires: { gt: new Date() } } })
  if (!session) redirect('/login')

  return <div dangerouslySetInnerHTML={{ __html: serveSpa('cuenta') }} suppressHydrationWarning />
}
