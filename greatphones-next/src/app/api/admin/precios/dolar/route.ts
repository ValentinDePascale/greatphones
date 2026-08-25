import { NextResponse } from 'next/server'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { obtenerDolar, type DolarTipo } from '@/lib/precios'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const tipo = (searchParams.get('tipo') as DolarTipo) || 'blue'
    const dolar = await obtenerDolar(tipo)
    if (!dolar) {
      return NextResponse.json({ error: 'No se pudo obtener la cotización del dólar' }, { status: 502 })
    }
    return NextResponse.json(dolar)
  } catch (error) {
    return handleRouteError(error)
  }
}
