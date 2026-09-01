import { NextResponse } from 'next/server'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { type DolarTipo } from '@/lib/precios'
import { dolarActual } from '@/lib/dolar-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const tipo = (searchParams.get('tipo') as DolarTipo) || 'blue'

    return NextResponse.json(await dolarActual(tipo))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { venta, compra } = body

    if (!venta || venta <= 0) {
      return NextResponse.json({ error: 'El valor de venta es requerido y debe ser > 0' }, { status: 400 })
    }

    await prisma.appConfig.upsert({
      where: { key: 'dolar_override' },
      create: {
        key: 'dolar_override',
        value: {
          venta,
          compra: compra || venta,
          fecha: new Date().toISOString(),
        },
      },
      update: {
        value: {
          venta,
          compra: compra || venta,
          fecha: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ success: true, venta, compra: compra || venta })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request)
    await prisma.appConfig.delete({ where: { key: 'dolar_override' } }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
