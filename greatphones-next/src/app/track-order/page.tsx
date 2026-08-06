'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TrackOrderPage() {
  const [code, setCode] = useState('')
  const [dni, setDni] = useState('')
  const router = useRouter()

  return (
    <div className="page-xs">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
        <h1 className="page-h1">Seguimiento de pedido</h1>
        <p className="page-sub">Ingresá tu código de pedido y DNI para ver el estado.</p>
      </div>

      <div className="form-group"><label className="f-label">Código de pedido</label><input className="f-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GP-XXXX-XXXX" /></div>
      <div className="form-group" style={{ marginBottom: 24 }}><label className="f-label">DNI</label><input className="f-input" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))} placeholder="Sin puntos" maxLength={8} /></div>

      <button className="btn-buy" onClick={() => router.push(`/track-order/${code}`)} disabled={!code || !dni} style={{ opacity: (code && dni) ? 1 : .5, cursor: (code && dni) ? 'pointer' : 'not-allowed', background: (code && dni) ? undefined : 'var(--border)', color: (code && dni) ? undefined : 'var(--gray)' }}>
        Buscar pedido
      </button>

      <div style={{ marginTop: 32, padding: 16, background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>
          También podés consultar el estado desde{' '}
          <button className="btn-link" onClick={() => router.push('/cuenta')}>Mi Cuenta</button>
        </div>
      </div>
    </div>
  )
}
