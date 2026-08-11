import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/AdminSidebar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') redirect('/')

  return user
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await checkAdmin()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FDF8F3' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: 0, minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: '#p-admin .admin-layout > div:first-child, #p-admin .admin-sidebar, #p-admin > div:first-child > div:first-child { display: none !important; } #p-admin .admin-layout > div:last-child, #p-admin > div:first-child > div:last-child { margin-left: 0 !important; flex: 1 !important; }' }} />
        {children}
      </main>
    </div>
  )
}
