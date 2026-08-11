import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { serveSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mi Cuenta — Great Phones', robots: { index: false, follow: false } }

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('__Secure-next-auth.session-token')?.value
    || cookieStore.get('next-auth.session-token')?.value
  if (!token) redirect('/login')
  const session = await prisma.session.findFirst({ where: { sessionToken: token, expires: { gt: new Date() } } })
  if (!session) redirect('/login')

  return <div dangerouslySetInnerHTML={{ __html: serveSpa('cuenta') }} suppressHydrationWarning />
}
