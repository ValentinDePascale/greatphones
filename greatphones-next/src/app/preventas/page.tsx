import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.', openGraph: { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.', type: 'website' } }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('preventas') }} suppressHydrationWarning /> }
