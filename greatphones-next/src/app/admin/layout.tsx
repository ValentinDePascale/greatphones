import AdminApp from '@/components/AdminApp'
import { serveAdminSpa } from '@/lib/spa-pages'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const html = serveAdminSpa('dashboard')
  return <AdminApp html={html}>{children}</AdminApp>
}