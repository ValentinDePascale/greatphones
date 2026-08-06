'use client'

import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  return (
    <div className="page-sm" style={{ textAlign: 'center' }}>
      <h1 className="page-h1">Finalizar compra</h1>
      <p className="page-sub" style={{ marginBottom: 32 }}>Revisá tu pedido y elegí el método de pago.</p>

      <div className="empty">
        <div className="empty-ico">🛒</div>
        <div className="empty-t">Tu carrito está vacío</div>
        <p className="empty-sub">Agregá productos desde el catálogo para comenzar.</p>
        <button className="btn-orange" onClick={() => router.push('/productos')}>Ver catálogo</button>
      </div>

      <div className="trust-row" style={{ marginTop: 24 }}>
        <div className="trust-b">🔒 Pago seguro</div>
        <div className="trust-b">📦 Envíos a todo el país</div>
        <div className="trust-b">🔄 Devolución 7 días</div>
      </div>
    </div>
  )
}
