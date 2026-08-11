import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' })

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  title: 'Great Phones - Tienda de Celulares',
  description: 'Tienda online de celulares y accesorios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {/* DNS-prefetch external domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://api.mercadopago.com" />
        <link rel="dns-prefetch" href="https://cdn.socket.io" />
        {/* Preconnect for critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        {/* Preload critical CSS */}
        <link rel="preload" href="/styles/globals.css?v=4" as="style" />
        <link rel="preload" href="/styles/components.css?v=4" as="style" />
        {/* Apply critical CSS immediately */}
        <link rel="stylesheet" href="/styles/globals.css?v=4" />
        <link rel="stylesheet" href="/styles/components.css?v=4" />
        <link rel="stylesheet" href="/styles/admin.css?v=4" />
        {/* Load fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`.page{display:none!important}.page.act,.page[style*="display:block"]{display:block!important}`}</style>
      </head>
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
