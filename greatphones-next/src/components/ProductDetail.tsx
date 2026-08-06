'use client'

import { useState } from 'react'
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
      <div style={{ height: 500, background: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <span style={{ fontSize: 80 }}>{product.ico}</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 120 }}>
      <div style={{ height: 500, background: '#fff', borderRadius: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <img src={current} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} />
        {images.length > 1 && (
          <>
            <button onClick={() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1))}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: '1px solid #E4DDD4', cursor: 'pointer', fontSize: 18, color: '#1a1a1a', zIndex: 10 }}>
              ←
            </button>
            <button onClick={() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0))}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: '1px solid #E4DDD4', cursor: 'pointer', fontSize: 18, color: '#1a1a1a', zIndex: 10 }}>
              →
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              height: 80, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              border: i === idx ? '2px solid #FF6B2C' : '1px solid #E4DDD4',
              opacity: i === idx ? 1 : 0.6, transition: 'all .15s',
            }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

  const badges = []
  if (isPromo) badges.push({ icon: '🏷️', text: product.discount + '% OFF', color: '#c0392b', bg: 'rgba(192,57,43,.1)' })
  badges.push({ icon: '✓', text: '12 Meses Garantía', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  badges.push({ icon: '✓', text: 'Cable + funda gratis', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  badges.push({ icon: '✓', text: 'Dev. 7 días', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  if (product.type === 'celular') badges.push({ icon: '✓', text: 'IMEI Verificado', color: '#2D5A27', bg: 'rgba(45,90,39,.1)' })
  if (product.isPreorder) badges.unshift({
    icon: '⭐', text: 'Preventa — Disponible ' + (product.availableFrom ? new Date(product.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'Próximamente'),
    color: '#FF6B2C', bg: 'rgba(255,107,44,.12)'
  })

  const specs = []
  if (product.screen) specs.push({ icon: '📱', label: 'Pantalla', val: product.screen + '″' })
  if (product.ram) specs.push({ icon: '⚡', label: 'RAM', val: product.ram })
  if (product.storage) specs.push({ icon: '💾', label: 'Almacenamiento', val: product.storage })
  if (product.processor) specs.push({ icon: '🧠', label: 'Procesador', val: product.processor })
  if (product.battery) specs.push({ icon: '🔋', label: 'Batería', val: product.battery + '%' })
  if (product.condition) specs.push({ icon: '✨', label: 'Condición', val: product.condition })
  const stockColor = product.stock > 5 ? '#2D5A27' : product.stock > 0 ? '#FF6B2C' : '#c0392b'
  specs.push({ icon: '📦', label: 'Stock', val: product.stock > 0 ? product.stock + ' disponibles' : 'Agotado', color: stockColor })

  return (
    <div style={{ background: '#FDF8F3', minHeight: '100vh', padding: '1.5rem var(--pad) 3rem', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Back button */}
        <button onClick={() => router.push('/productos')} style={{
          background: 'none', border: 'none', color: '#9A9186', cursor: 'pointer',
          fontSize: 14, padding: '8px 0', marginBottom: 16, fontWeight: 600,
        }}>
          ← Volver al catálogo
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Image gallery */}
          <DetailImages product={product} />

          {/* Product info */}
          <div>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: '#9A9186', marginBottom: 16 }}>
              <span style={{ color: '#2D5A27', fontWeight: 600 }}>{product.brand}</span>
              <span style={{ color: '#C4B8A8' }}>›</span>
              <span>{product.type || 'Celular'}</span>
              <span style={{ color: '#C4B8A8' }}>›</span>
              <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{product.name}</span>
            </nav>

            {/* Name */}
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, color: '#1a1a1a' }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: isPromo ? '#FF6B2C' : '#1a1a1a' }}>
                {fmt(finalPrice)}
              </span>
              {isPromo && (
                <span style={{ fontSize: 16, color: '#9A9186', textDecoration: 'line-through', marginLeft: 10 }}>
                  {fmt(product.price)}
                </span>
              )}
            </div>

            {/* Installments */}
            <div style={{ fontSize: 14, color: '#2D5A27', fontWeight: 600, marginBottom: 20, padding: '10px 14px', background: 'rgba(45,90,39,.06)', borderRadius: 10, display: 'inline-block' }}>
              12x {fmt(cuota)} sin interés
            </div>

            {/* Description */}
            {product.sub && (
              <div style={{ fontSize: 14, color: '#9A9186', lineHeight: 1.7, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E4DDD4' }}>
                {product.sub}
              </div>
            )}

            {/* Specs */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#1a1a1a', marginBottom: 12 }}>
                Características
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {specs.map((s, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #E4DDD4', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#9A9186', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.color || '#1a1a1a' }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #E4DDD4' }}>
              {badges.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: b.bg, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: b.color }}>
                  {b.icon} {b.text}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => router.push(`/checkout`)}
                style={{
                  width: '100%', padding: '16px 0', background: 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)',
                  color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {product.isPreorder ? 'Reservar Ahora' : 'Comprar ahora'}
              </button>
              <button
                onClick={() => router.push(`/checkout`)}
                style={{
                  width: '100%', padding: '14px 0', background: '#fff', color: '#1a1a1a',
                  border: '1.5px solid #E4DDD4', borderRadius: 14, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {product.isPreorder ? 'Reservar' : 'Agregar al carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
