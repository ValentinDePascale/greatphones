import { requireAdmin } from '@/lib/auth-guard'
import AdminLayoutClient from './AdminLayoutClient'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificar que el usuario sea admin antes de renderizar el layout
  await requireAdmin()

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
