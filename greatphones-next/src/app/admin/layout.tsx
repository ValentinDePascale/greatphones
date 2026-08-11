import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
