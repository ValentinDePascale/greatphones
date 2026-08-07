import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Productos — Great Phones', description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más.' }
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('shop') }} suppressHydrationWarning /> }
