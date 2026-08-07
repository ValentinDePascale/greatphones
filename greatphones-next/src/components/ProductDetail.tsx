'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Product } from './ProductCard'

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

function DetailImages({ product }: { product: Product }) {
  const images = product.imageUrl ? [product.imageUrl, ...(product.images || [])] : []
  const [idx, setIdx] = useState(0)
  const current = images[idx]

  if (!current && product.ico) {
    return (
      <div className="dt-main"><span className="dt-ico">{product.ico}</span></div>
    )
  }

  return (
    <div className="dt-imgs">
      <div className="dt-main">
        <Image src={current} alt={product.name} fill sizes="50vw" style={{ objectFit: 'contain', padding: 16 }} />
        {images.length > 1 && (
          <>
            <button className="dt-nav dt-prev" onClick={() => setIdx(i => i > 0 ? i - 1 : images.length - 1)}>←</button>
            <button className="dt-nav dt-next" onClick={() => setIdx(i => i < images.length - 1 ? i + 1 : 0)}>→</button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="dt-thumbs">
          {images.map((img, i) => (
            <div key={i} className={`dt-thumb${i === idx ? ' dt-thumb-on' : ''}`} onClick={() => setIdx(i)}>
              <Image src={img} alt="" fill sizes="10vw" style={{ objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const isPromo = product.isOffer && product.discount > 0
  const finalPrice = isPromo ? Math.round(product.price * (1 - product.discount / 100)) : product.price
  const cuota = Math.round(finalPrice / 12)

  const specs: { icon: string; label: string; val: string; color?: string }[] = []
  if (product.screen) specs.push({ icon: '📱', label: 'Pantalla', val: product.screen + '″' })
  if (product.ram) specs.push({ icon: '⚡', label: 'RAM', val: product.ram })
  if (product.storage) specs.push({ icon: '💾', label: 'Almacenamiento', val: product.storage })
  if (product.processor) specs.push({ icon: '🧠', label: 'Procesador', val: product.processor })
  if (product.battery) specs.push({ icon: '🔋', label: 'Batería', val: product.battery + '%' })
  if (product.condition) specs.push({ icon: '✨', label: 'Condición', val: product.condition })
  const stockColor = product.stock > 5 ? '#2D5A27' : product.stock > 0 ? '#FF6B2C' : '#c0392b'
  specs.push({ icon: '📦', label: 'Stock', val: product.stock > 0 ? product.stock + ' disponibles' : 'Agotado', color: stockColor })

  const badges: { icon: string; text: string; color: string; bg: string }[] = []
  if (isPromo) badges.push({ icon: '🏷️', text: product.discount + '% OFF', color: '#c0392b', bg: 'rgba(192,57,43,.1)' })
  badges.push({ icon: '✓', text: '12 Meses Garantía', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  badges.push({ icon: '✓', text: 'Cable + funda gratis', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  badges.push({ icon: '✓', text: 'Dev. 7 días', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  if (product.type === 'celular') badges.push({ icon: '✓', text: 'IMEI Verificado', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  if (product.isPreorder) badges.unshift({
    icon: '⭐', text: 'Preventa — Disponible ' + (product.availableFrom ? new Date(product.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'Próximamente'),
    color: '#FF6B2C', bg: 'rgba(255,107,44,.12)'
  })

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '1.5rem clamp(0.875rem, 3vw, 1.75rem) 3rem' }}>
      <div className="page-xl" style={{ padding: '0' }}>
        <button className="dt-back" onClick={() => router.push('/productos')}>← Volver al catálogo</button>

        <div className="dt-grid">
          <DetailImages product={product} />

          <div>
            <nav className="dt-bc">
              <span className="dt-bc-brand">{product.brand}</span>
              <span style={{ color: 'var(--gray2)' }}>›</span>
              <span>{product.type || 'Celular'}</span>
              <span style={{ color: 'var(--gray2)' }}>›</span>
              <span style={{ color: 'var(--dk)', fontWeight: 600 }}>{product.name}</span>
            </nav>

            <h1 className="dt-name">{product.name}</h1>

            <div className="detail-price-wrap">
              <span className="dt-pr" style={{ color: isPromo ? 'var(--orange)' : 'var(--dk)' }}>{fmt(finalPrice)}</span>
              {isPromo && <span className="dt-old">{fmt(product.price)}</span>}
            </div>

            <div className="dt-cuota">12x {fmt(cuota)} sin interés</div>

            {product.sub && <div className="dt-desc">{product.sub}</div>}

            <div className="dt-specs-t">Características</div>
            <div className="dt-specs">
              {specs.map((s, i) => (
                <div className="dt-spec" key={i}>
                  <div className="dt-spec-ico">{s.icon}</div>
                  <div>
                    <div className="dt-spec-l">{s.label}</div>
                    <div className="dt-spec-v" style={{ color: s.color || 'var(--dk)' }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dt-badges">
              {badges.map((b, i) => (
                <div className="dt-badge" key={i} style={{ color: b.color, background: b.bg }}>
                  {b.icon} {b.text}
                </div>
              ))}
            </div>

            <div className="dt-actions">
              <button className="btn-buy" onClick={() => router.push('/checkout')}>
                {product.isPreorder ? 'Reservar Ahora' : 'Comprar ahora'}
              </button>
              <button className="btn-cart" onClick={() => router.push('/checkout')}>
                {product.isPreorder ? 'Reservar' : 'Agregar al carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
