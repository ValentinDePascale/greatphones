import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'

const meta: Record<string, Metadata> = {
  ofertas: { title: 'Ofertas — Great Phones', description: 'Las mejores ofertas en celulares reacondicionados.' },
  accesorios: { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares y más.' },
  preventas: { title: 'Preventas — Great Phones', description: 'Reservá los próximos lanzamientos.' },
  garantias: { title: 'Garantías — Great Phones', description: '12 meses de garantía incluida.' },
  checkout: { title: 'Checkout — Great Phones', robots: { index: false, follow: false } as const },
  cuenta: { title: 'Mi Cuenta — Great Phones', robots: { index: false, follow: false } as const },
  login: { title: 'Iniciar Sesión — Great Phones', robots: { index: false, follow: false } as const },
  favoritos: { title: 'Favoritos — Great Phones', robots: { index: false, follow: false } as const },
  terminos: { title: 'Términos — Great Phones' },
  privacidad: { title: 'Privacidad — Great Phones' },
  'track-order': { title: 'Seguimiento — Great Phones', robots: { index: false, follow: false } as const },
}

export default function Page() {
  const html = existsSync(join(process.cwd(), 'public', 'index.html'))
    ? readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8')
    : '<h1>Loading...</h1>'
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
}
