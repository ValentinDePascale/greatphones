import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

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

export default function Home() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(htmlPath)
    ? readFileSync(htmlPath, 'utf-8')
    : '<h1>Loading...</h1>'
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
