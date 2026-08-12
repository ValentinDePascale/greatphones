import { serveAdminSpa } from '@/lib/spa-pages'
import AdminPageClient from '../AdminPageClient'
export const dynamic = 'force-dynamic'
export default function Page() {
  const html = serveAdminSpa('orders')
  return <AdminPageClient html={html} tab="orders" />
}
