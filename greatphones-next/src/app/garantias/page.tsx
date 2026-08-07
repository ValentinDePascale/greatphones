import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Garantías — Great Phones', description: '12 meses de garantía incluida.' }

export default function Page() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
