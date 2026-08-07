import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { serveSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true, sub: true, brand: true } })
  if (!p) return { title: 'Producto no encontrado' }
  return { title: `${p.name} — Great Phones`, description: `${p.brand} ${p.sub || ''}`.trim() }
}
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('detail') }} suppressHydrationWarning /> }
