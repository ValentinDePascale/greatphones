'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface Product {
  id: string
  name: string
  brand: string
  sub?: string
  price: number
  isOffer: boolean
  discount: number
  imageUrl?: string
  images?: string[]
  ico?: string
  stock: number
  sold?: number
  condition?: string
  storage?: string
  color?: string
  type?: string
  screen?: number
  ram?: string
  processor?: string
  battery?: number
  isPreorder?: boolean
  availableFrom?: string
  offerEnd?: string
  offerStart?: string
  modelGroup?: string
  description?: string
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
    <div
      onClick={() => router.push(`/productos/${p.id}`)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid #E4DDD4',
        cursor: 'pointer',
        transition: 'all .2s',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = '#FF6B2C'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,.06)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = '#E4DDD4'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '1/1', background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
        ) : (
          <span style={{ fontSize: 52 }}>{p.ico || '📱'}</span>
        )}
        {/* Condition badge */}
        {p.condition && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: p.condition === 'Nuevo' ? 'rgba(45,90,39,.12)' : 'rgba(255,107,44,.08)',
            color: p.condition === 'Nuevo' ? '#2D5A27' : '#FF6B2C',
            padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          }}>
            {p.condition}
          </span>
        )}
        {/* Discount badge */}
        {isPromo && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(192,57,43,.12)', color: '#c0392b',
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          }}>
            -{p.discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: 11, color: '#9A9186', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>
          {p.brand}
        </div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 16, fontWeight: 700, color: '#1a1a1a',
          marginBottom: 6, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {p.name}
        </div>
        {p.sub && (
          <div style={{ fontSize: 11, color: '#8B7355', marginBottom: 10, lineHeight: 1.4 }}>
            {p.sub}
          </div>
        )}
        {/* Specs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {p.storage && (
            <span style={{ fontSize: 10, color: '#6B6259', background: '#EDE6D8', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
              {p.storage}
            </span>
          )}
          {p.color && (
            <span style={{ fontSize: 10, color: '#6B6259', background: '#EDE6D8', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
              {p.color}
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 700, color: isPromo ? '#FF6B2C' : '#1a1a1a',
          }}>
            {fmt(finalPrice)}
          </span>
          {isPromo && (
            <span style={{ fontSize: 13, color: '#9A9186', textDecoration: 'line-through' }}>
              {fmt(p.price)}
            </span>
          )}
        </div>

        {/* Cuotas */}
        <div style={{ fontSize: 11, color: '#2D5A27', fontWeight: 600, marginBottom: 12 }}>
          12x {fmt(cuota)} sin interés
        </div>

        {/* Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/productos/${p.id}`)
          }}
          style={{
            width: '100%', padding: '10px 0',
            background: 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all .15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
        >
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
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9A9186' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📱</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
          No se encontraron productos
        </div>
        <div style={{ fontSize: 14 }}>Probá con otros filtros o volvé más tarde</div>
      </div>
    )
  }

  return (
    <div>
      {/* Sort */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: '8px 12px', border: '1.5px solid #E4DDD4', borderRadius: 8,
            fontSize: 12, fontWeight: 600, color: '#1a1a1a', background: '#fff',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="rel">Más relevantes</option>
          <option value="sold">Más vendidos</option>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {sorted.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  )
}
