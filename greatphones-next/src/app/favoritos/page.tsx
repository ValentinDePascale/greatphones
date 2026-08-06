'use client'

import { useRouter } from 'next/navigation'

export default function FavoritosPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>
        Favoritos
      </h1>

      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>♡</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
          Nada guardado aún
        </div>
        <p style={{ fontSize: 14, color: '#9A9186', marginBottom: 24 }}>
          Tocá el corazón en cualquier producto para guardarlo acá.
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
    </div>
  )
}
