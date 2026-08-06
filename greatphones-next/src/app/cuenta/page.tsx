import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mi Cuenta — Great Phones', robots: { index: false, follow: false } }

export default function CuentaPage() {
  return (
    <div className="page-sm">
      <h1 className="page-h1">Mi Cuenta</h1>
      <div className="cu-list" style={{ marginTop: 24 }}>
        <Link href="/cuenta/pedidos" className="cu-item">
          <div className="cu-item-ico">📦</div>
          <div style={{ flex: 1 }}>
            <div className="cu-item-t">Mis Pedidos</div>
            <div className="cu-item-sub">Seguimiento y estado de tus compras</div>
          </div>
          <div className="cu-item-arr">→</div>
        </Link>
        <Link href="/favoritos" className="cu-item">
          <div className="cu-item-ico">♡</div>
          <div style={{ flex: 1 }}>
            <div className="cu-item-t">Favoritos</div>
            <div className="cu-item-sub">Productos y accesorios guardados</div>
          </div>
          <div className="cu-item-arr">→</div>
        </Link>
      </div>
    </div>
  )
}
