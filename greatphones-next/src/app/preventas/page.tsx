import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import PageClient from '@/components/PageClient'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.', openGraph: { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.', type: 'website' } }
export default function Page() {
  const html = serveSpa('preventas')
  return <PageClient html={html} />
}
