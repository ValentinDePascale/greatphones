'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TrackOrderPage() {
  const [code, setCode] = useState('')
  const [dni, setDni] = useState('')
  const router = useRouter()

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          Seguimiento de pedido
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          Ingresá tu código de pedido y DNI para ver el estado.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Código de pedido
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GP-XXXX-XXXX"
            style={{ width: '100%', padding: '12px', border: '1.5px solid #E4DDD4', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            DNI
          </label>
          <input
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            placeholder="Sin puntos"
            maxLength={8}
            style={{ width: '100%', padding: '12px', border: '1.5px solid #E4DDD4', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <button
        onClick={() => router.push(`/track-order/${code}`)}
        disabled={!code || !dni}
        style={{
          width: '100%', padding: '14px', background: (code && dni) ? 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)' : '#E4DDD4',
          color: (code && dni) ? '#fff' : '#9A9186', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: (code && dni) ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
        }}
      >
        Buscar pedido
      </button>

      <div style={{ marginTop: 32, padding: 16, background: '#FDF8F3', borderRadius: 10, border: '1px solid #E4DDD4' }}>
        <div style={{ fontSize: 12, color: '#9A9186', textAlign: 'center' }}>
          También podés consultar el estado de tu pedido desde{' '}
          <button onClick={() => router.push('/cuenta')} style={{ background: 'none', border: 'none', color: '#FF6B2C', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline' }}>
            Mi Cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
