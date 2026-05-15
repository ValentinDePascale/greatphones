'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderCode = searchParams.get('order')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clear cart from localStorage after successful payment
    try {
      localStorage.removeItem('cart')
      localStorage.removeItem('cartCount')
    } catch (e) {}
    setLoading(false)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '3rem 2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 80px rgba(0,0,0,.1)'
      }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #059669',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Verificando pago...</p>
          </div>
        ) : (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              ¡Pago confirmado!
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
              Tu compra ha sido procesada correctamente
            </p>
            {orderCode && (
              <div style={{
                background: '#f0fdf4',
                padding: '1rem',
                borderRadius: '12px',
                borderLeft: '4px solid #059669',
                marginBottom: '2rem'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Número de orden</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                  {orderCode}
                </p>
              </div>
            )}
            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                📧 Te enviamos un email con los detalles de tu compra
              </p>
              <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                📦 Estamos preparando tu pedido
              </p>
              <p style={{ fontSize: '13px', color: '#374151' }}>
                🛡️ Tu compra tiene garantía de 90 días
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '14px',
                background: '#ff6b2c',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Seguir comprando
            </button>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
