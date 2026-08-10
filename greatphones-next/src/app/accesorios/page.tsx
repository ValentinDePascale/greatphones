import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares, cables y más.', openGraph: { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares y más.', type: 'website' } }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('accesorios') }} suppressHydrationWarning /> }
