import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Ofertas — Great Phones',
  description: 'Las mejores ofertas en celulares reacondicionados. Descuentos reales con garantía de 12 meses.',
  openGraph: { title: 'Ofertas — Great Phones', description: 'Las mejores ofertas en celulares reacondicionados.', type: 'website' },
}
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('ofertas') }} suppressHydrationWarning /> }
