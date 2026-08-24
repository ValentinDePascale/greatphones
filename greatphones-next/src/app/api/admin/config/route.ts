import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getConfig, setConfig } from '@/lib/config'

// Claves permitidas para editar desde el panel
const ALLOWED = ['REGALOS', 'PRECIOS_COTIZACION', 'GARANTIA', 'ENVIO']

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Falta la clave (key)' }, { status: 400 })
    const value = await getConfig(key, null)
    return NextResponse.json({ key, value })
  } catch (error) {
    console.error('[Admin Config GET]', error)
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { key, value } = body
    if (!key) return NextResponse.json({ error: 'Falta la clave' }, { status: 400 })
    if (!ALLOWED.includes(key)) return NextResponse.json({ error: 'Clave no editable' }, { status: 403 })
    await setConfig(key, value, admin.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Config PUT]', error)
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}