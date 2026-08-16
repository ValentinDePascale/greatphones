'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/productos', label: 'Productos', icon: '📱' },
  { href: '/admin/accesorios', label: 'Accesorios', icon: '📦' },
  { href: '/admin/stock', label: 'Stock', icon: '📋' },
  { href: '/admin/promos', label: 'Promociones', icon: '🏷️' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📑' },
  { href: '/admin/ventas', label: 'Ventas', icon: '📈' },
  { href: '/admin/arrepentimientos', label: 'Arrepentimientos', icon: '↩️' },
  { href: '/admin/chat', label: 'Chat', icon: '💬' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: '💵' },
  { href: '/admin/instore', label: 'Venta en Tienda', icon: '🏪' },
  { href: '/admin/preventa', label: 'Preventas', icon: '⭐' },
  { href: '/admin/comprados', label: 'Comprados', icon: '🛒' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: '#ffffff', color: '#0f172a',
      padding: '1rem 0', position: 'fixed', left: 0, top: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e5e7eb',
      boxShadow: '1px 0 3px rgba(0,0,0,.04)',
    }}>
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
            <Link key={t.href} href={t.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none',
              color: active ? '#FF6B2C' : '#64748b',
              background: active ? 'rgba(255,107,44,.08)' : 'transparent',
              fontSize: 13, fontWeight: active ? 600 : 500,
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', fontSize: 11 }}>
        <Link href="/home" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver a la tienda</Link>
      </div>
    </aside>
  )
}
