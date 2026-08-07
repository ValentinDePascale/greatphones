'use client'

import Link from 'next/link'

export default function DetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{
      minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12, padding: '3rem 1rem', textAlign: 'center',
      background: 'var(--cream)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--dk)' }}>
        Producto no encontrado
      </h2>
      <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 400 }}>
        Es posible que este producto haya sido eliminado o no esté disponible.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={reset} style={{
          padding: '10px 24px', background: 'var(--orange)', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Reintentar
        </button>
        <Link href="/productos" style={{
          padding: '10px 24px', background: '#fff', color: 'var(--dk)',
          border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14,
          fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit',
        }}>
          Ver catálogo
        </Link>
      </div>
    </div>
  )
}
