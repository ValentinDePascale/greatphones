import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ofertas — Great Phones',
  description: 'Las mejores ofertas en celulares reacondicionados. Descuentos reales con garantía de 12 meses.',
  openGraph: {
    title: 'Ofertas — Great Phones',
    description: 'Las mejores ofertas en celulares reacondicionados.',
    type: 'website',
  },
}

export default async function OfertasPage() {
  const now = new Date()
  const products = await prisma.product.findMany({
    where: {
      isPreorder: { not: true },
      stock: { gt: 0 },
      isOffer: true,
      discount: { gt: 0 },
      OR: [{ offerEnd: null }, { offerEnd: { gt: now } }],
      AND: [{ OR: [{ offerStart: null }, { offerStart: { lte: now } }] }],
    },
    orderBy: { discount: 'desc' },
    take: 200,
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700, color: '#1a1a1a', marginBottom: 8,
        }}>
          Ofertas
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          {products.length} productos en oferta
        </p>
      </div>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
