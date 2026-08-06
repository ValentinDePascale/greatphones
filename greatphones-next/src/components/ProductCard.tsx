'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface Product {
  id: string; name: string; brand: string; sub?: string; price: number
  isOffer: boolean; discount: number; imageUrl?: string; images?: string[]
  ico?: string; stock: number; sold?: number; condition?: string
  storage?: string; color?: string; type?: string; screen?: number
  ram?: string; processor?: string; battery?: number; isPreorder?: boolean
  availableFrom?: string; offerEnd?: string; offerStart?: string
  modelGroup?: string; description?: string
}

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

export function ProductCard({ p }: { p: Product }) {
  const router = useRouter()
  const isPromo = p.isOffer && p.discount > 0
  const finalPrice = isPromo ? Math.round(p.price * (1 - p.discount / 100)) : p.price
  const cuota = Math.round(finalPrice / 12)

  return (
    <div className="pc" onClick={() => router.push(`/productos/${p.id}`)}>
      <div className="pc-img">
        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span className="pc-ico">{p.ico || '📱'}</span>}
        {p.condition && (
          <span className="pc-badge-cond" style={{ background: p.condition === 'Nuevo' ? 'rgba(45,90,39,.12)' : 'rgba(255,107,44,.08)', color: p.condition === 'Nuevo' ? '#2D5A27' : '#FF6B2C' }}>
            {p.condition}
          </span>
        )}
        {isPromo && <span className="pc-badge-disc">-{p.discount}%</span>}
      </div>
      <div className="pc-info">
        <div className="pc-brand">{p.brand}</div>
        <div className="pc-name">{p.name}</div>
        {p.sub && <div className="pc-sub">{p.sub}</div>}
        <div className="pc-specs">
          {p.storage && <span className="pc-spec">{p.storage}</span>}
          {p.color && <span className="pc-spec">{p.color}</span>}
        </div>
        <div className="pc-pr-row">
          <span className="pc-price" style={{ color: isPromo ? 'var(--orange)' : 'var(--dk)' }}>{fmt(finalPrice)}</span>
          {isPromo && <span className="pc-old">{fmt(p.price)}</span>}
        </div>
        <div className="pc-cuota">12x {fmt(cuota)} sin interés</div>
        <button className="pc-btn" onClick={(e) => { e.stopPropagation(); router.push(`/productos/${p.id}`) }}>
          Ver producto
        </button>
      </div>
    </div>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState('rel')

  const sorted = [...products].sort((a, b) => {
    if (sort === 'asc') return a.price - b.price
    if (sort === 'desc') return b.price - a.price
    if (sort === 'sold') return (b.sold || 0) - (a.sold || 0)
    return 0
  })

  if (products.length === 0) {
    return (
      <div className="pgrid-empty">
        <div className="pgrid-empty-ico">📱</div>
        <div className="pgrid-empty-t">No se encontraron productos</div>
        <div className="pgrid-empty-sub">Probá con otros filtros o volvé más tarde</div>
      </div>
    )
  }

  return (
    <div>
      <div className="pg-sort">
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rel">Más relevantes</option>
          <option value="sold">Más vendidos</option>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </div>
      <div className="pgrid">
        {sorted.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  )
}
