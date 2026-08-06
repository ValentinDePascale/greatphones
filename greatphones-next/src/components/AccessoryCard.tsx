'use client'

import { useState } from 'react'

interface Accessory {
  id: string
  name: string
  brand?: string
  category?: string
  price: number
  stock: number
  imageUrl?: string
  ico?: string
  color?: string
  compatibleModels?: string
  description?: string
  isOffer?: boolean
  discount?: number
}

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

function AccCard({ a }: { a: Accessory }) {
  const isPromo = a.isOffer && a.discount && a.discount > 0
  const finalPrice = isPromo ? Math.round(a.price * (1 - (a.discount || 0) / 100)) : a.price

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #E4DDD4',
      overflow: 'hidden', transition: 'all .2s', cursor: 'pointer', position: 'relative',
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
      <div style={{ aspectRatio: '1/1', background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {a.imageUrl ? (
          <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
        ) : (
          <span style={{ fontSize: 52 }}>{a.ico || '📦'}</span>
        )}
        {isPromo && (
          <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(192,57,43,.12)', color: '#c0392b', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
            -{a.discount}%
          </span>
        )}
      </div>
      <div style={{ padding: '14px' }}>
        {a.category && (
          <div style={{ fontSize: 10, color: '#9A9186', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>
            {a.category}
          </div>
        )}
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 16, fontWeight: 700, color: '#1a1a1a',
          marginBottom: 4, lineHeight: 1.3,
        }}>
          {a.name}
        </div>
        {a.brand && <div style={{ fontSize: 11, color: '#8B7355', marginBottom: 10 }}>{a.brand}</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: isPromo ? '#FF6B2C' : '#1a1a1a' }}>
            {fmt(finalPrice)}
          </span>
          {isPromo && <span style={{ fontSize: 13, color: '#9A9186', textDecoration: 'line-through' }}>{fmt(a.price)}</span>}
        </div>
        <div style={{ fontSize: 11, color: a.stock > 0 ? '#2D5A27' : '#c0392b', fontWeight: 600 }}>
          {a.stock > 0 ? a.stock + ' disponibles' : 'Agotado'}
        </div>
      </div>
    </div>
  )
}

export function AccessoryGrid({ accessories }: { accessories: Accessory[] }) {
  const [category, setCategory] = useState('')
  const cats = [...new Set(accessories.map(a => a.category).filter((c): c is string => !!c))]

  const filtered = category ? accessories.filter(a => a.category === category) : accessories

  if (accessories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9A9186' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
          No hay accesorios disponibles
        </div>
      </div>
    )
  }

  return (
    <div>
      {cats.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategory('')}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1.5px solid #E4DDD4', background: !category ? '#FF6B2C' : '#fff',
              color: !category ? '#fff' : '#1a1a1a', fontFamily: 'inherit',
              transition: 'all .15s',
            }}
          >
            Todos
          </button>
          {cats.map(c => (
            <button key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1.5px solid #E4DDD4', background: category === c ? '#FF6B2C' : '#fff',
                color: category === c ? '#fff' : '#1a1a1a', fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {filtered.map(a => <AccCard key={a.id} a={a} />)}
      </div>
    </div>
  )
}
