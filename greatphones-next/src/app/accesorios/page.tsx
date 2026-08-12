import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import PageClient from '@/components/PageClient'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares, cables y más.', openGraph: { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares y más.', type: 'website' } }
export default function Page() {
  const html = serveSpa('accesorios')
  return <PageClient html={html} />
}
