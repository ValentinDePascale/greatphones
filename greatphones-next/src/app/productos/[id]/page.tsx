import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath)
    ? readFileSync(htmlPath, 'utf-8')
    : '<h1>Loading...</h1>'

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { inventoryItems: { take: 50, orderBy: { createdAt: 'desc' } } }
    })

    if (!product) notFound()

    const dataScript = `<script>
window.__INITIAL_DETAIL__=${JSON.stringify({
  product,
  variants: product.inventoryItems || []
})};
window.__INITIAL_DETAIL_ID__="${id}";
</script>`

    html = html.replace('</body>', dataScript + '</body>')
  } catch {
    html = html.replace('</body>', `<script>window.__INITIAL_DETAIL_ID__="${id}";</script></body>`)
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
  )
}
