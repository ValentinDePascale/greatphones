import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Great Phones — Tecnología premium. Precio justo.',
  description: 'Comprá celulares reacondicionados premium, accesorios y más. Garantía real de 12 meses. Envíos a todo el país.',
  openGraph: {
    title: 'Great Phones — Tecnología premium. Precio justo.',
    description: 'Comprá celulares reacondicionados premium con garantía de 12 meses.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default async function Home() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath)
    ? readFileSync(htmlPath, 'utf-8')
    : '<h1>Loading...</h1>'

  try {
    // Pre-fetch initial data for faster first paint
    const [products, accessories] = await Promise.all([
      prisma.product.findMany({
        where: { isPreorder: { not: true } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.accessory.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ])

    const dataScript = `<script>window.__INITIAL_PRODUCTS__=${JSON.stringify(products)};window.__INITIAL_ACCESSORIES__=${JSON.stringify(accessories)};window.__INITIAL_DATA_LOADED__=true;</script>`

    // Inject before </body>
    html = html.replace('</body>', dataScript + '</body>')
  } catch {
    // If DB fails, still serve the page with empty initial data
    const fallback = '<script>window.__INITIAL_PRODUCTS__=[];window.__INITIAL_ACCESSORIES__=[];window.__INITIAL_DATA_LOADED__=true;</script>'
    html = html.replace('</body>', fallback + '</body>')
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
