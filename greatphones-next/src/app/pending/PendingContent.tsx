'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export function PendingContent() {
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
          background: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Pago pendiente
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
          Tu pago esta siendo procesado. Una vez confirmado, te enviaremos un email con los detalles.
        </p>
        {orderCode && (
          <div style={{
            background: '#fef3c7',
            padding: '1rem',
            borderRadius: '12px',
            borderLeft: '4px solid #d97706',
            marginBottom: '2rem'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Numero de orden</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>
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
            Si elegiste pagar con:
          </p>
          <ul style={{ fontSize: '13px', color: '#374151', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li><strong>Rapipago / Pago Facil:</strong> Presenta el cupon de pago en cualquier sucursal</li>
            <li><strong>Transferencia:</strong> Realiza la transferencia dentro de las 24 horas</li>
            <li><strong>Tarjeta de debito:</strong> El pago se procesa automaticamente</li>
          </ul>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.5rem' }}>
          El tiempo de confirmacion puede variar entre 1 y 48 horas segun el metodo de pago elegido.
        </p>
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
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
