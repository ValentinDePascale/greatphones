import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductCard'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ofertas — Great Phones',
  description: 'Las mejores ofertas en celulares reacondicionados.',
  openGraph: { title: 'Ofertas — Great Phones', description: 'Las mejores ofertas en celulares reacondicionados.', type: 'website' },
}

export default async function OfertasPage() {
  const now = new Date()
  const products = await prisma.product.findMany({
    where: { isPreorder: { not: true }, stock: { gt: 0 }, isOffer: true, discount: { gt: 0 }, OR: [{ offerEnd: null }, { offerEnd: { gt: now } }], AND: [{ OR: [{ offerStart: null }, { offerStart: { lte: now } }] }] },
    orderBy: { discount: 'desc' }, take: 200,
  })

  return (
    <div className="page-xl">
      <h1 className="page-h1">Ofertas</h1>
      <p className="page-sub">{products.length} productos en oferta</p>
      <ProductGrid products={JSON.parse(JSON.stringify(products)) as Product[]} />
    </div>
  )
}
