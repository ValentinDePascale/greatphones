import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (!/^[a-z0-9]{20,30}$/i.test(id)) {
    return { title: 'Producto no encontrado — Great Phones' }
  }
  try {
    const product = await prisma.product.findUnique({ where: { id } })
    if (product) {
      return {
        title: `${product.name} — Great Phones`,
        description: `${product.brand} ${product.name}${product.storage ? ' — ' + product.storage : ''}`
      }
    }
    const acc = await prisma.accessory.findUnique({ where: { id } })
    if (acc) {
      return { title: `${acc.name} — Great Phones`, description: acc.category ? `${acc.category} — ${acc.name}` : acc.name }
    }
    return { title: 'Producto no encontrado — Great Phones' }
  } catch {
    return { title: 'Producto — Great Phones' }
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Validar formato del id (Prisma CUID: empieza con 'c', 25 chars alfanuméricos)
  // Evita inyecciones en el <script> posterior
  if (!/^[a-z0-9]{20,30}$/i.test(id)) {
    return notFound()
  }
  let html = serveSpa('detail')

  try {
    const product = await prisma.product.findUnique({ where: { id } })
    if (product) {
      let variants: any[] = []
      if (product.modelGroup) {
        variants = await prisma.product.findMany({
          where: { modelGroup: product.modelGroup, id: { not: id } }
        })
      }
      const detailData = JSON.stringify({
        product: {
          id: product.id, name: product.name, brand: product.brand,
          price: product.price, imageUrl: product.imageUrl || '',
          ico: product.ico || '', images: product.images || [],
          condition: product.condition || '', storage: product.storage || '',
          color: product.color || '', battery: product.battery || null,
          screen: product.screen || null, ram: product.ram || '',
          processor: product.processor || '', description: product.description || '',
          stock: product.stock, sub: product.sub || '', type: product.type || '',
          isOffer: product.isOffer, discount: product.discount || 0,
          offerEnd: product.offerEnd ? product.offerEnd.toISOString() : null,
          offerStart: product.offerStart ? product.offerStart.toISOString() : null,
          modelGroup: product.modelGroup || '',
        },
        variants: variants.map(v => ({
          id: v.id, name: v.name, price: v.price, targetPrice: v.price,
          storage: v.storage || '', color: v.color || '', ram: v.ram || '',
          imageUrl: v.imageUrl || '', ico: v.ico || '',
          stock: v.stock, condition: v.condition || '',
        }))
      })
      html = html.replace('</body>',
        '<script>window.__INITIAL_DETAIL_ID__=' + JSON.stringify(id) + ';window.__INITIAL_DETAIL__=' + detailData + '</script></body>')
      return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
    }

    const acc = await prisma.accessory.findUnique({ where: { id } })
    if (acc) {
      const detailData = JSON.stringify({
        product: null,
        accessory: {
          id: acc.id, name: acc.name, brand: acc.brand || '',
          price: acc.price, imageUrl: acc.imageUrl || '',
          ico: acc.ico || '', images: acc.images || [],
          category: acc.category || '', color: acc.color || '',
          description: acc.description || '', stock: acc.stock,
          isOffer: acc.isOffer || false, discount: acc.discount || 0,
          offerEnd: acc.offerEnd ? acc.offerEnd.toISOString() : null,
          offerStart: acc.offerStart ? acc.offerStart.toISOString() : null,
          modelGroup: acc.modelGroup || '', compatibleModels: acc.compatibleModels || '',
        }
      })
      html = html.replace('</body>',
        '<script>window.__INITIAL_ACCS_DETAIL_ID__=' + JSON.stringify(id) + ';window.__INITIAL_ACCS_DETAIL__=' + detailData + '</script></body>')
      return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
    }
  } catch {
    return notFound()
  }

  return notFound()
}
