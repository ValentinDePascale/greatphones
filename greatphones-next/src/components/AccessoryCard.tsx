'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Accessory {
  id: string; name: string; brand?: string; category?: string; price: number
  stock: number; imageUrl?: string; ico?: string; color?: string
  compatibleModels?: string; description?: string; isOffer?: boolean; discount?: number
}

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

function AccCard({ a }: { a: Accessory }) {
  const isPromo = a.isOffer && a.discount && a.discount > 0
  const finalPrice = isPromo ? Math.round(a.price * (1 - (a.discount || 0) / 100)) : a.price

  return (
    <div className="ac">
      <div className="ac-img">
        {a.imageUrl ? <Image src={a.imageUrl} alt={a.name} fill sizes="(max-width: 768px) 50vw, 20vw" style={{ objectFit: 'contain', padding: 12 }} /> : <span className="ac-ico">{a.ico || '📦'}</span>}
        {isPromo && <span className="ac-disc">-{a.discount}%</span>}
      </div>
      <div className="ac-info">
        {a.category && <div className="ac-cat">{a.category}</div>}
        <div className="ac-name">{a.name}</div>
        {a.brand && <div className="ac-brand">{a.brand}</div>}
        <div className="ac-pr-row">
          <span className="ac-price" style={{ color: isPromo ? 'var(--orange)' : 'var(--dk)' }}>{fmt(finalPrice)}</span>
        </div>
        <div className="ac-stock" style={{ color: a.stock > 0 ? 'var(--green)' : 'var(--red)' }}>
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
      <div className="pgrid-empty">
        <div className="pgrid-empty-ico">📦</div>
        <div className="pgrid-empty-t">No hay accesorios disponibles</div>
      </div>
    )
  }

  return (
    <div>
      {cats.length > 1 && (
        <div className="chips">
          <button className={`chip${!category ? ' chip-on' : ''}`} onClick={() => setCategory('')}>Todos</button>
          {cats.map(c => (
            <button key={c} className={`chip${category === c ? ' chip-on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      )}
      <div className="pgrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {filtered.map(a => <AccCard key={a.id} a={a} />)}
      </div>
    </div>
  )
}
