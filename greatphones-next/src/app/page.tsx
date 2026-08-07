import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Great Phones — Tecnología premium. Precio justo.', description: 'Comprá celulares reacondicionados premium y más. Garantía real de 12 meses.', robots: { index: true, follow: true } }

export default function Home() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('home') }} suppressHydrationWarning /> }
