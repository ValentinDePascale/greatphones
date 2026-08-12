import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import PageClient from '@/components/PageClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Productos — Great Phones', description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más.' }
export default function Page() {
  const html = serveSpa('shop')
  return <PageClient html={html} />
}
