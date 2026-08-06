import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Great Phones',
  robots: { index: true, follow: false },
}

export default function PrivacidadPage() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
