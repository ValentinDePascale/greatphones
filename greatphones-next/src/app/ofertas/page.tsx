import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import PageClient from '@/components/PageClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Ofertas — Great Phones',
  description: 'Las mejores ofertas en celulares reacondicionados. Descuentos reales con garantía de 12 meses.',
  openGraph: { title: 'Ofertas — Great Phones', description: 'Las mejores ofertas en celulares reacondicionados.', type: 'website' },
}
export default function Page() {
  const html = serveSpa('ofertas')
  return <PageClient html={html} />
}
