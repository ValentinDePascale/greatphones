import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { serveAdminSpa } from '@/lib/spa-pages'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const html = serveAdminSpa('dashboard')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e) {
    console.error('[Admin Shell]', e)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}