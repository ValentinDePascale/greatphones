'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Page error:', error) }, [error])

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12, padding: '3rem 1rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--dk)' }}>
        Algo salió mal
      </h2>
      <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 400 }}>
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={reset} style={{
          padding: '10px 24px', background: 'var(--orange)', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Reintentar
        </button>
        <Link href="/" style={{
          padding: '10px 24px', background: '#fff', color: 'var(--dk)',
          border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14,
          fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit',
        }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
