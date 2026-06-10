'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export function FailureContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderCode = searchParams.get('order')

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
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Pago no procesado
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
          No pudimos procesar tu pago. No te preocupes, no se ha realizado ningun cargo.
        </p>
        {orderCode && (
          <div style={{
            background: '#fef2f2',
            padding: '1rem',
            borderRadius: '12px',
            borderLeft: '4px solid #dc2626',
            marginBottom: '2rem'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Orden asociada</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>
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
            Posibles motivos:
          </p>
          <ul style={{ fontSize: '13px', color: '#374151', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li>Fondos insuficientes en la tarjeta</li>
            <li>La tarjeta no permite compras online</li>
            <li>Error en los datos ingresados</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Volver al inicio
          </button>
          <button
            onClick={() => router.push('/checkout')}
            style={{
              flex: 1,
              padding: '14px',
              background: '#ff6b2c',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}
