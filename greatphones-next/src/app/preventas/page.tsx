import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preventas — Great Phones',
  description: 'Reservá los próximos lanzamientos. Asegurá tu equipo antes que nadie.',
  openGraph: {
    title: 'Preventas — Great Phones',
    description: 'Reservá los próximos lanzamientos. Asegurá tu equipo antes que nadie.',
    type: 'website',
  },
}

export default async function PreventasPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Loading...</h1>'

  try {
    const products = await prisma.product.findMany({
      where: { isPreorder: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    html = html.replace('</body>', `<script>window.__INITIAL_PREORDER_PRODUCTS__=${JSON.stringify(products)};window.__INITIAL_PREVENTAS__=true;</script></body>`)
  } catch {
    html = html.replace('</body>', '<script>window.__INITIAL_PREVENTAS__=true;</script></body>')
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
