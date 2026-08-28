import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where: any = {
      deletedAt: null,
      status: { in: ['DELIVERED', 'COMPLETED', 'THIRD_PARTY'] },
    }

    if (desde) {
      const d = new Date(desde + 'T00:00:00')
      if (!isNaN(d.getTime())) where.createdAt = { ...(where.createdAt || {}), gte: d }
    }
    if (hasta) {
      const d = new Date(hasta + 'T23:59:59')
      if (!isNaN(d.getTime())) where.createdAt = { ...(where.createdAt || {}), lte: d }
    }

    const repairs = await prisma.repair.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    // Calcular ganancia por cada reparación
    const reparacionesConGanancia = repairs.map(r => {
      const pricePaid = r.pricePaid || 0
      const costAplicable = r.status === 'THIRD_PARTY' ? (r.thirdPartyCost || 0) : r.cost
      const profitReal = pricePaid - costAplicable
      return { ...r, profitReal }
    })

    // Agrupar por estado
    const porEstado: Record<string, any> = {}
    for (const r of reparacionesConGanancia) {
      if (!porEstado[r.status]) {
        porEstado[r.status] = {
          estado: r.status,
          cantidad: 0,
          ingresos: 0,
          costos: 0,
          ganancia: 0,
        }
      }
      const pricePaid = r.pricePaid || 0
      const costAplicable = r.status === 'THIRD_PARTY' ? (r.thirdPartyCost || 0) : r.cost
      porEstado[r.status].cantidad += 1
      porEstado[r.status].ingresos += pricePaid
      porEstado[r.status].costos += costAplicable
      porEstado[r.status].ganancia += pricePaid - costAplicable
    }

    const detalleEstado = Object.values(porEstado)

    // Totales
    const totalReparaciones = reparacionesConGanancia.length
    const ingresoTotal = reparacionesConGanancia.reduce((sum, r) => sum + (r.pricePaid || 0), 0)
    const costoTotal = reparacionesConGanancia.reduce(
      (sum, r) => sum + (r.status === 'THIRD_PARTY' ? r.thirdPartyCost || 0 : r.cost),
      0,
    )
    const gananciaNeta = ingresoTotal - costoTotal

    const resumen = {
      totalReparaciones,
      ingresoTotal,
      costoTotal,
      gananciaNeta,
    }

    return NextResponse.json({
      periodoDesde: desde || null,
      periodoHasta: hasta || null,
      resumen,
      detalleEstado,
      reparaciones: reparacionesConGanancia,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
