import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Términos y Condiciones — Great Phones' }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('terminos') }} suppressHydrationWarning /> }
