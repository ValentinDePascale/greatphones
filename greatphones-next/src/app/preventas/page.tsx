import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preventas — Great Phones',
  description: 'Reservá los próximos lanzamientos. Asegurá tu equipo antes que nadie.',
  openGraph: {
    title: 'Preventas — Great Phones',
    description: 'Reservá los próximos lanzamientos.',
    type: 'website',
  },
}

export default async function PreventasPage() {
  const products = await prisma.product.findMany({
    where: { isPreorder: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700, color: '#1a1a1a', marginBottom: 8,
        }}>
          Preventas
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          {products.length} productos en preventa
        </p>
      </div>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
