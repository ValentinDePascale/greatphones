import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Productos — Great Phones',
  description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más con garantía de 12 meses.',
  openGraph: { title: 'Productos — Great Phones', description: 'Todos nuestros celulares reacondicionados.', type: 'website' },
}

export default async function ProductosPage() {
  const products = await prisma.product.findMany({
    where: { isPreorder: { not: true }, stock: { gt: 0 } },
    orderBy: [{ sold: 'desc' }, { score: 'desc' }], take: 200,
  })

  return (
    <div className="page-xl">
      <h1 className="page-h1">Catálogo</h1>
      <p className="page-sub">{products.length} productos disponibles</p>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
