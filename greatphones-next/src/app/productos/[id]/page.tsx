import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductDetail from '@/components/ProductDetail'
import type { Product } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true, sub: true, brand: true } })
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} — Great Phones`,
    description: `${product.brand} ${product.sub || ''}`.trim(),
    openGraph: {
      title: `${product.name} — Great Phones`,
      description: `${product.brand} ${product.sub || ''}`.trim(),
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true, name: true, brand: true, sub: true, price: true,
      isOffer: true, discount: true, imageUrl: true, ico: true,
      stock: true, condition: true, storage: true, color: true,
      type: true, screen: true, ram: true, processor: true,
      battery: true, isPreorder: true, availableFrom: true,
      offerEnd: true, offerStart: true, modelGroup: true, images: true,
      description: true, createdAt: true
    }
  })

  if (!product) notFound()

  const isPromo = product.isOffer && product.discount > 0
  const finalPrice = isPromo ? Math.round(product.price * (1 - product.discount / 100)) : product.price
  const availability = product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.sub || '',
        brand: { '@type': 'Brand', name: product.brand },
        image: product.imageUrl || undefined,
        offers: {
          '@type': 'Offer',
          price: finalPrice,
          priceCurrency: 'ARS',
          availability: availability,
          priceValidUntil: product.offerEnd ? new Date(product.offerEnd).toISOString().split('T')[0] : undefined,
          seller: { '@type': 'Organization', name: 'Great Phones' }
        },
        ...(product.condition ? { itemCondition: product.condition === 'Nuevo' ? 'https://schema.org/NewCondition' : 'https://schema.org/RefurbishedCondition' } : {})
      }) }} />
      <ProductDetail product={product as unknown as Product} />
    </>
  )
}
