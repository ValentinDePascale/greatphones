import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Iniciar Sesión — Great Phones', robots: { index: false, follow: false } }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('login') }} suppressHydrationWarning /> }
