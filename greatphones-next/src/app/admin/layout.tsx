import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/AdminSidebar'
import { cookies } from 'next/headers'

async function checkAdmin() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('next-auth.session-token')?.value
    || cookieStore.get('__Secure-next-auth.session-token')?.value
  
  if (!sessionToken) redirect('/login')
  
  const session = await prisma.session.findFirst({
    where: { sessionToken, expires: { gt: new Date() } },
    select: { userId: true },
  })
  
  if (!session) redirect('/login')
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, name: true },
  })
  
  if (!user || user.role !== 'ADMIN') redirect('/')
  
  return user
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await checkAdmin()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FDF8F3' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: '2rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
