import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Productos — Great Phones',
  description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más con garantía de 12 meses.',
  openGraph: {
    title: 'Productos — Great Phones',
    description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más.',
    type: 'website',
  },
}

export default async function ShopPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath)
    ? readFileSync(htmlPath, 'utf-8')
    : '<h1>Loading...</h1>'

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isPreorder: { not: true }, stock: { gt: 0 } },
      orderBy: [{ sold: 'desc' }, { score: 'desc' }],
      take: 200,
    })

    const dataScript = `<script>window.__INITIAL_PRODUCTS__=${JSON.stringify(products)};window.__INITIAL_CATALOG__=true;</script>`

    html = html.replace('</body>', dataScript + '</body>')
  } catch {
    html = html.replace('</body>', '<script>window.__INITIAL_CATALOG__=true;</script></body>')
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
  )
}
