'use client'

import Link from 'next/link'

interface Props {
  titulo: string
}

export default function AdminTopbar({ titulo }: Props) {
  return (
    <header className="admin-topbar" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <h1 className="admin-topbar-title">{titulo}</h1>
      </div>
      <div className="admin-topbar-actions">
        <Link
          href="/"
          className="admin-btn"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            store
          </span>
          Ver tienda
        </Link>
      </div>
    </header>
  )
}
