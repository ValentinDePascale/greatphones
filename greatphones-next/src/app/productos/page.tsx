import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'
import CatalogSearch from '@/components/CatalogSearch'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Productos — Great Phones',
  description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más con garantía de 12 meses.',
  openGraph: { title: 'Productos — Great Phones', description: 'Todos nuestros celulares reacondicionados.', type: 'website' },
}

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ search?: string; brand?: string }> }) {
  const { search, brand } = await searchParams

  const where: Record<string, unknown> = { isPreorder: { not: true }, stock: { gt: 0 } }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { brand: { contains: search, mode: 'insensitive' as const } },
      { sub: { contains: search, mode: 'insensitive' as const } },
    ]
  }
  if (brand) {
    where.brand = { contains: brand, mode: 'insensitive' as const }
  }

  const products = await prisma.product.findMany({ where, orderBy: [{ sold: 'desc' }, { score: 'desc' }], take: 200 })

  return (
    <div className="page-xl">
      <h1 className="page-h1">{search ? `"${search}"` : brand || 'Catálogo'}</h1>
      <p className="page-sub">{products.length} producto{products.length !== 1 ? 's' : ''}{brand ? ' de ' + brand : search ? ' encontrado' + (products.length !== 1 ? 's' : '') : ' disponibles'}</p>
      <Suspense fallback={<div style={{ height: 42 }} />}>
        <CatalogSearch defaultValue={search || ''} />
      </Suspense>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
