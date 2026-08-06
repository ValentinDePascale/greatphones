import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mi Cuenta — Great Phones',
  robots: { index: false, follow: false },
}

export default function CuentaPage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>
        Mi Cuenta
      </h1>

      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <Link href="/cuenta/pedidos" style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
          borderBottom: '1px solid #F0EBE3', textDecoration: 'none', color: 'inherit',
          transition: 'background .15s',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            📦
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Mis Pedidos</div>
            <div style={{ fontSize: 12, color: '#9A9186' }}>Seguimiento y estado de tus compras</div>
          </div>
          <div style={{ color: '#C4B8A8' }}>→</div>
        </Link>
        <Link href="/favoritos" style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
          borderBottom: '1px solid #F0EBE3', textDecoration: 'none', color: 'inherit',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            ♡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Favoritos</div>
            <div style={{ fontSize: 12, color: '#9A9186' }}>Productos y accesorios guardados</div>
          </div>
          <div style={{ color: '#C4B8A8' }}>→</div>
        </Link>
      </div>
    </div>
  )
}
