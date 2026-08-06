import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Garantías y Seguros — Great Phones',
  description: 'Extendé la garantía de tu equipo. Todos los equipos incluyen 12 meses de garantía sin cargo.',
  openGraph: {
    title: 'Garantías y Seguros — Great Phones',
    description: 'Extendé la garantía de tu equipo. Todos los equipos incluyen 12 meses de garantía sin cargo.',
    type: 'website',
  },
}

export default function GarantiasPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
