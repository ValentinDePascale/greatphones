import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Productos — Great Phones',
  description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más con garantía de 12 meses.',
  openGraph: {
    title: 'Productos — Great Phones',
    description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más.',
    type: 'website',
  },
}

export default async function ProductosPage() {
  const products = await prisma.product.findMany({
    where: { isPreorder: { not: true }, stock: { gt: 0 } },
    orderBy: [{ sold: 'desc' }, { score: 'desc' }],
    take: 200,
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700,
          color: '#1a1a1a',
          marginBottom: 8,
        }}>
          Catálogo
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          {products.length} productos disponibles
        </p>
      </div>

      <ProductGrid products={JSON.parse(JSON.stringify(products))} />
    </div>
  )
}
