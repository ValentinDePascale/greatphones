'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/productos', label: 'Productos', icon: '📱' },
  { href: '/admin/accesorios', label: 'Accesorios', icon: '📦' },
  { href: '/admin/promos', label: 'Promociones', icon: '🏷️' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📋' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: '💵' },
  { href: '/admin/arrepentimientos', label: 'Arrepentimientos', icon: '↩️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#1A1208', color: '#fff',
      padding: '1rem 0', position: 'fixed', left: 0, top: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '.5rem' }}>
        <Link href="/admin" style={{ textDecoration: 'none', color: '#FF6B2C', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
          Great Phones
        </Link>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>Panel de administración</div>
      </div>

      <nav style={{ flex: 1, padding: '0 .5rem' }}>
        {tabs.map(t => {
          const active = pathname === t.href || (t.href !== '/admin' && pathname.startsWith(t.href))
          return (
            <Link key={t.href} href={t.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none',
              color: active ? '#fff' : 'rgba(255,255,255,.5)',
              background: active ? 'rgba(255,107,44,.2)' : 'transparent',
              fontSize: 13, fontWeight: active ? 600 : 400,
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>← Volver a la tienda</Link>
      </div>
    </aside>
  )
}
