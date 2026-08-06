import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Great Phones - Tienda de Celulares',
  description: 'Tienda online de celulares y accesorios',
}

function getHeadHtml(): string {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  if (!existsSync(htmlPath)) return ''
  const html = readFileSync(htmlPath, 'utf-8')
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/)
  if (!headMatch) return ''
  // Remove <title> (Next.js handles it via metadata) and keep the rest
  return headMatch[1].replace(/<title>[\s\S]*?<\/title>\s*/g, '')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headHtml = getHeadHtml()

  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      {headHtml ? <head dangerouslySetInnerHTML={{ __html: headHtml }} /> : null}
      <body>
        {children}
      </body>
    </html>
  )
}
