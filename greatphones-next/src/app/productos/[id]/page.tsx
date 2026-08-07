import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true, sub: true, brand: true } })
  if (!p) return { title: 'Producto no encontrado' }
  return { title: `${p.name} — Great Phones`, description: `${p.brand} ${p.sub || ''}`.trim() }
}

export default function Page() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
