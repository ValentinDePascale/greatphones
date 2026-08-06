import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accesorios — Great Phones',
  description: 'Cargadores, fundas, auriculares, cables y más accesorios para tu celular.',
  openGraph: {
    title: 'Accesorios — Great Phones',
    description: 'Cargadores, fundas, auriculares, cables y más accesorios para tu celular.',
    type: 'website',
  },
}

export default async function AccesoriosPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  let html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Loading...</h1>'

  try {
    const accessories = await prisma.accessory.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    html = html.replace('</body>', `<script>window.__INITIAL_ACCESSORIES__=${JSON.stringify(accessories)};window.__INITIAL_ACC_PAGE__=true;</script></body>`)
  } catch {
    html = html.replace('</body>', '<script>window.__INITIAL_ACC_PAGE__=true;</script></body>')
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
