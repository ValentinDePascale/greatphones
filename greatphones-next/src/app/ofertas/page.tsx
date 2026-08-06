import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ofertas — Great Phones',
  description: 'Las mejores ofertas en celulares reacondicionados. Descuentos reales con garantía de 12 meses.',
  openGraph: {
    title: 'Ofertas — Great Phones',
    description: 'Las mejores ofertas en celulares reacondicionados. Descuentos reales con garantía de 12 meses.',
    type: 'website',
  },
}

export default async function OfertasPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Loading...</h1>'

  try {
    const now = new Date()
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isPreorder: { not: true },
        isOffer: true,
        discount: { gt: 0 },
        OR: [
          { offerEnd: null },
          { offerEnd: { gt: now } },
        ],
        AND: [
          { OR: [
            { offerStart: null },
            { offerStart: { lte: now } },
          ]},
        ],
      },
      orderBy: { discount: 'desc' },
      take: 200,
    })
    html = html.replace('</body>', `<script>window.__INITIAL_PRODUCTS__=${JSON.stringify(products)};window.__INITIAL_OFERTAS__=true;</script></body>`)
  } catch {
    html = html.replace('</body>', '<script>window.__INITIAL_OFERTAS__=true;</script></body>')
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
