import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: 0, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
