import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Great Phones — Tecnología premium. Precio justo.',
  description: 'Comprá celulares reacondicionados premium, accesorios y más. Garantía real de 12 meses.',
  openGraph: { title: 'Great Phones — Tecnología premium. Precio justo.', description: 'Comprá celulares reacondicionados premium con garantía de 12 meses.', type: 'website' },
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
    prisma.product.findMany({ where: { isPreorder: { not: true }, stock: { gt: 0 } }, orderBy: [{ sold: 'desc' }, { score: 'desc' }], take: 12 }),
    prisma.product.findMany({
      where: { isPreorder: { not: true }, stock: { gt: 0 }, isOffer: true, discount: { gt: 0 }, OR: [{ offerEnd: null }, { offerEnd: { gt: new Date() } }] },
      orderBy: { discount: 'desc' }, take: 8,
    }),
  ])

  return (
    <div>
      <section className="home-hero">
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">⭐ Tecnología premium</div>
          <h1 className="hero-title">Tecnología premium.<br />Precio justo.</h1>
          <p className="hero-desc">Celulares reacondicionados con garantía de 12 meses. Calidad garantizada al mejor precio.</p>
          <div className="hero-actions">
            <Link href="/productos" className="btn-orange">Ver catálogo</Link>
            <Link href="/ofertas" className="btn-outline">Ver ofertas</Link>
          </div>
        </div>
      </section>

      <div className="page-xl">
        <div className="cat-grid">
          {categories.map(c => (
            <Link key={c.slug} href={`/productos?brand=${c.slug}`} className="cat-card">
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>

      {offerProducts.length > 0 && (
        <div className="page-xl">
          <div className="section-hdr">
            <h2 className="section-title">Ofertas</h2>
            <Link href="/ofertas" className="section-link">Ver todas →</Link>
          </div>
          <ProductGrid products={JSON.parse(JSON.stringify(offerProducts)) as Product[]} />
        </div>
      )}

      <div className="page-xl">
        <div className="section-hdr">
          <h2 className="section-title">Catálogo</h2>
          <Link href="/productos" className="section-link">Ver todos →</Link>
        </div>
        <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Great Phones', url: 'https://greatphones.com.ar',
        logo: 'https://greatphones.com.ar/icons/539432645_17922071475132461_1228687370142381845_n.jpg',
        description: 'Celulares reacondicionados premium con garantía de 12 meses',
        address: { '@type': 'PostalAddress', addressLocality: 'Bahía Blanca', addressCountry: 'AR' }
      }) }} />
    </div>
  )
}
