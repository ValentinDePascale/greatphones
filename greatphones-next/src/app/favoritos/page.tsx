import type { Metadata } from 'next'
import { serveSpa } from '@/lib/spa-pages'
import PageClient from '@/components/PageClient'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Favoritos — Great Phones', robots: { index: false, follow: false } }
export default function Page() {
  const html = serveSpa('favoritos')
  return <PageClient html={html} />
}
