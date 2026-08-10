import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Política de Privacidad — Great Phones' }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('privacidad') }} suppressHydrationWarning /> }
