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
  const product = await prisma.product.findUnique({ where: { id } })

  if (!product) notFound()

  return <ProductDetail product={product as unknown as Product} />
}
