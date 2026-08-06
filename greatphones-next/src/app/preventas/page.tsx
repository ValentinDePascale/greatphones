import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preventas — Great Phones',
  description: 'Reservá los próximos lanzamientos.',
  openGraph: { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.', type: 'website' },
}

export default async function PreventasPage() {
  const products = await prisma.product.findMany({ where: { isPreorder: true }, orderBy: { createdAt: 'desc' }, take: 50 })

  return (
    <div className="page-xl">
      <h1 className="page-h1">Preventas</h1>
      <p className="page-sub">{products.length} productos en preventa</p>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
