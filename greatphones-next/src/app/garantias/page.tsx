import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Garantías — Great Phones', description: '12 meses de garantía incluida en todos los equipos.', openGraph: { title: 'Garantías — Great Phones', description: '12 meses de garantía incluida.', type: 'website' } }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('garantias') }} suppressHydrationWarning /> }
