'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/admin/productos', label: 'Productos', icon: 'smartphone' },
  { href: '/admin/accesorios', label: 'Accesorios', icon: 'headphones' },
  { href: '/admin/stock', label: 'Stock', icon: 'inventory_2' },
  { href: '/admin/promos', label: 'Promociones', icon: 'local_offer' },
  { href: '/admin/cupones', label: 'Cupones', icon: 'confirmation_number' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: 'shopping_bag' },
  { href: '/admin/ventas', label: 'Ventas', icon: 'payments' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: 'request_quote' },
  { href: '/admin/comprados', label: 'Cotizaciones Dashboard', icon: 'space_dashboard' },
  { href: '/admin/arrepentimientos', label: 'Arrepentimientos', icon: 'undo' },
  { href: '/admin/chat', label: 'Chat', icon: 'chat' },
  { href: '/admin/instore', label: 'Venta en Tienda', icon: 'point_of_sale' },
  { href: '/admin/preventa', label: 'Preventas', icon: 'event' },
  { href: '/admin/contabilidad', label: 'Caja / Contabilidad', icon: 'account_balance' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'group' },
]

interface Props {
  open: boolean
  onToggle: () => void
}

export default function AdminSidebar({ open, onToggle }: Props) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          onClick={onToggle}
          className="admin-sidebar-scrim"
          style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(15,23,42,.45)',
          }}
        />
      )}
      <aside
        className={`admin-sidebar ${open ? 'admin-sidebar-open' : ''}`}
        style={{
          width: 240,
          minHeight: '100vh',
          background: '#ffffff',
          color: '#0f172a',
          padding: '1rem 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '.5rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#FF6B2C', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
            Great Phones
          </Link>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, letterSpacing: '.5px', textTransform: 'uppercase' }}>
            Panel de administración
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 .5rem', overflow: 'auto' }}>
          {tabs.map(t => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
            return (
              <Link key={t.href} href={t.href} onClick={onToggle} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, marginBottom: 2, textDecoration: 'none',
                color: active ? '#FF6B2C' : '#64748b',
                background: active ? 'rgba(255,107,44,.08)' : 'transparent',
                fontSize: 13, fontWeight: active ? 600 : 500,
                transition: 'all .15s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">{t.icon}</span>
                {t.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', fontSize: 11 }}>
          <Link href="/home" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver a la tienda</Link>
        </div>
      </aside>
    </>
  )
}