import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Great Phones — Tecnología premium. Precio justo.',
  description: 'Comprá celulares reacondicionados premium, accesorios y más. Garantía real de 12 meses.',
  openGraph: {
    title: 'Great Phones — Tecnología premium. Precio justo.',
    description: 'Comprá celulares reacondicionados premium con garantía de 12 meses.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const categories = [
  { icon: '📱', name: 'iPhone', slug: 'iPhone' },
  { icon: '📱', name: 'Samsung', slug: 'Samsung' },
  { icon: '💻', name: 'MacBook', slug: 'MacBook' },
  { icon: '📱', name: 'iPad', slug: 'iPad' },
  { icon: '📱', name: 'Motorola', slug: 'Motorola' },
  { icon: '📱', name: 'Xiaomi', slug: 'Xiaomi' },
]

export default async function HomePage() {
  const [products, offerProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isPreorder: { not: true }, stock: { gt: 0 } },
      orderBy: [{ sold: 'desc' }, { score: 'desc' }],
      take: 12,
    }),
    prisma.product.findMany({
      where: {
        isPreorder: { not: true },
        stock: { gt: 0 },
        isOffer: true,
        discount: { gt: 0 },
        OR: [{ offerEnd: null }, { offerEnd: { gt: new Date() } }],
      },
      orderBy: { discount: 'desc' },
      take: 8,
    }),
  ])

  const allProducts = JSON.parse(JSON.stringify(products)) as Product[]
  const offers = JSON.parse(JSON.stringify(offerProducts)) as Product[]

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1A1208 0%, #2D1F10 50%, #0E0B07 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,107,44,.15)', color: '#FF6B2C',
            padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            marginBottom: 16, letterSpacing: '.5px',
          }}>
            ⭐ Tecnología premium
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700, color: '#fff',
            lineHeight: 1.1, marginBottom: 16,
          }}>
            Tecnología premium.<br />Precio justo.
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Celulares reacondicionados con garantía de 12 meses. Calidad garantizada al mejor precio.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/productos" style={{
              padding: '14px 32px', background: 'linear-gradient(135deg, #FF6B2C 0%, #e55a1a 100%)',
              color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700,
              textDecoration: 'none', transition: 'all .15s', fontFamily: 'inherit',
            }}>
              Ver catálogo
            </Link>
            <Link href="/ofertas" style={{
              padding: '14px 32px', background: 'rgba(255,255,255,.1)', color: '#fff',
              borderRadius: 12, fontSize: 15, fontWeight: 600, border: '1px solid rgba(255,255,255,.15)',
              textDecoration: 'none', transition: 'all .15s', fontFamily: 'inherit',
            }}>
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32,
        }}>
          {categories.map(c => (
            <Link key={c.slug} href={`/productos?brand=${c.slug}`}
              style={{
                background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4',
                padding: '20px 16px', textAlign: 'center', textDecoration: 'none',
                transition: 'all .15s', cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#FF6B2C'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E4DDD4'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Offers strip */}
      {offers.length > 0 && (
        <section style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
              Ofertas
            </h2>
            <Link href="/ofertas" style={{ fontSize: 13, color: '#FF6B2C', fontWeight: 600, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <ProductGrid products={offers} />
        </section>
      )}

      {/* Full catalog */}
      <section style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
            Catálogo
          </h2>
          <Link href="/productos" style={{ fontSize: 13, color: '#FF6B2C', fontWeight: 600, textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>
        <ProductGrid products={allProducts} />
      </section>
    </div>
  )
}
