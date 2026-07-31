import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const SPA_ROUTES = new Set([
  '', 'home', 'shop', 'sell', 'detail', 'favoritos', 'accesorios', 'garantias',
  'ofertas', 'chats', 'admin', 'cuenta', 'checkout', 'terminos', 'privacidad',
  'edit-profile', 'admin-product', 'login', 'register', 'forgot-password',
  'reset-password', 'track-order', 'compare', 'mensajes', 'mayorista',
  'notebooks', 'servicio', 'scan', 'redeem',
])

function isSpaRoute(path: string): boolean {
  const normalized = path.replace(/^\/+/, '').replace(/\/+$/, '').split('/')[0]
  return SPA_ROUTES.has(normalized)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname

  if (!isSpaRoute(path)) {
    return NextResponse.json({ error: 'Not found', path }, { status: 404 })
  }

  const indexPath = join(process.cwd(), 'public', 'index.html')
  if (!existsSync(indexPath)) {
    return NextResponse.json({ error: 'Not found', path }, { status: 404 })
  }

  const html = readFileSync(indexPath, 'utf-8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
