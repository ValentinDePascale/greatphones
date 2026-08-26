'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminSpaHost, { isLegacyPath } from './AdminSpaHost'

interface Props {
  html: string
  children: React.ReactNode
}

export default function AdminApp({ html, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const legacy = isLegacyPath(pathname)

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminSidebar open={open} onToggle={() => setOpen(o => !o)} />
      <main
        className="admin-main-wrap"
        onClick={() => open && setOpen(false)}
        style={{ flex: 1, minHeight: '100vh', padding: 0, width: '100%' }}
      >
        <div
          className="admin-mobile-bar"
          onClick={() => setOpen(false)}
          style={{
            position: 'sticky', top: 0, zIndex: 90,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', background: '#fff',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <button
            aria-label="Abrir menú"
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, color: '#0f172a',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Panel Admin</span>
        </div>
        {/* El shell legacy queda montado de por vida (oculto en secciones React).
            Las páginas legacy (children = AdminTabActivator) piden activar su tab. */}
        <AdminSpaHost html={html} legacy={legacy} />
        <div style={{ display: legacy ? 'none' : 'block' }}>{children}</div>
      </main>
    </div>
  )
}