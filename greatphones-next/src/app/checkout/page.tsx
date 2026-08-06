import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout — Great Phones',
  description: 'Finalizá tu compra de forma segura. MercadoPago, transferencia y más métodos de pago.',
  openGraph: {
    title: 'Checkout — Great Phones',
    description: 'Finalizá tu compra de forma segura. MercadoPago, transferencia y más métodos de pago.',
    type: 'website',
  },
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
