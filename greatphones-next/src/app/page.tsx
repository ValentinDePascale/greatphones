import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Great Phones — Tecnología premium. Precio justo.',
  description: 'Comprá celulares reacondicionados premium y más. Garantía real de 12 meses.',
  openGraph: { title: 'Great Phones', description: 'Tecnología premium. Precio justo.', type: 'website' },
  robots: { index: true, follow: true },
}

export default function Home() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
