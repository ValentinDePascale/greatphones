'use client'

import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          Finalizar compra
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          Revisá tu pedido y elegí el método de pago.
        </p>
      </div>

      <div style={{ background: '#FDF8F3', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '2rem', textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
          Tu carrito está vacío
        </div>
        <p style={{ fontSize: 13, color: '#9A9186', marginBottom: 20 }}>
          Agregá productos desde el catálogo para comenzar.
        </p>
        <button
          onClick={() => router.push('/productos')}
          style={{
            padding: '12px 32px', background: 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Ver catálogo
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E4DDD4', padding: '10px 16px', fontSize: 12, color: '#2D5A27', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 Pago seguro
        </div>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E4DDD4', padding: '10px 16px', fontSize: 12, color: '#2D5A27', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          📦 Envíos a todo el país
        </div>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E4DDD4', padding: '10px 16px', fontSize: 12, color: '#2D5A27', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔄 Devolución 7 días
        </div>
      </div>
    </div>
  )
}
