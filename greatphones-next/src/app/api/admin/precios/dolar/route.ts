import { NextResponse } from 'next/server'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { obtenerDolar, type DolarTipo } from '@/lib/precios'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const tipo = (searchParams.get('tipo') as DolarTipo) || 'blue'

    // Chequear si hay override manual
    const override = await prisma.appConfig.findUnique({ where: { key: 'dolar_override' } })
    if (override?.value && typeof override.value === 'object' && 'venta' in override.value) {
      return NextResponse.json({
        venta: (override.value as any).venta,
        compra: (override.value as any).compra || (override.value as any).venta,
        fecha: (override.value as any).fecha,
        fuente: 'manual',
      })
    }

    const dolar = await obtenerDolar(tipo)
    if (dolar) {
      return NextResponse.json(dolar)
    }

    // Si falla obtenerDolar pero hay override anterior, devolverlo como fallback
    const lastOverride = await prisma.appConfig.findUnique({ where: { key: 'dolar_override' } })
    if (lastOverride?.value && typeof lastOverride.value === 'object' && 'venta' in lastOverride.value) {
      return NextResponse.json({
        venta: (lastOverride.value as any).venta,
        compra: (lastOverride.value as any).compra || (lastOverride.value as any).venta,
        fecha: (lastOverride.value as any).fecha,
        fuente: 'manual (fallback)',
      })
    }

    // Si todo falla, devolver valor default
    return NextResponse.json({
      venta: 1000,
      compra: 950,
      fecha: new Date().toISOString(),
      fuente: 'default (API indisponible)',
    })
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
