'use client'

import { useRouter } from 'next/navigation'

export default function FavoritosPage() {
  const router = useRouter()

  return (
    <div className="page-xl">
      <h1 className="page-h1">Favoritos</h1>
      <div className="pgrid-empty" style={{ borderRadius: 0, border: 'none' }}>
        <div className="pgrid-empty-ico">♡</div>
        <div className="pgrid-empty-t">Nada guardado aún</div>
        <p className="pgrid-empty-sub">Tocá el corazón en cualquier producto para guardarlo acá.</p>
        <button className="btn-orange" onClick={() => router.push('/productos')}>Ver catálogo</button>
      </div>
    </div>
  )
}
