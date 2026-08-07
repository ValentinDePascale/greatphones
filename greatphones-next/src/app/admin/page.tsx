import { serveAdminSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <div dangerouslySetInnerHTML={{ __html: serveAdminSpa() }} suppressHydrationWarning />
}
