import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Productos — Great Phones',
  description: 'Todos nuestros celulares reacondicionados. iPhone, Samsung, Motorola y más.',
}

export default function Page() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
