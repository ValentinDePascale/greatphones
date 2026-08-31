import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

/** Indicadores por operador (base para definir comisiones, como el ERP). */
export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    // Rango opcional: desde=YYYY-MM-DD hasta=YYYY-MM-DD
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const range: any = {}
    if (desde) range.gte = new Date(desde + 'T00:00:00')
    if (hasta) range.lte = new Date(hasta + 'T23:59:59')
    const whereOperators: any[] = [{ operator: { not: null } }]
    const whereDate = Object.keys(range).length ? { opDate: range } : {}

    const groupBy = await prisma.accountingEntry.groupBy({
      by: ['operator'],
      where: { ...whereDate, type: 'INGRESO', operator: { not: null } },
      _count: { _all: true },
      _sum: { amount: true },
    })

    // Complementar con datos de ventas / reparaciones por operador
    const ventasPorOp = await prisma.accountingEntry.groupBy({
      by: ['operator'],
      where: { ...whereDate, source: 'SALE', type: 'INGRESO', operator: { not: null } },
      _count: { _all: true },
      _sum: { amount: true },
    })
    const reparacionesPorOp = await prisma.accountingEntry.groupBy({
      by: ['operator'],
      where: { ...whereDate, source: { in: ['REPAIR'] }, type: 'INGRESO', operator: { not: null } },
      _count: { _all: true },
      _sum: { amount: true },
    })

    const byOperator = (arr: any[]) => (arr || []).map(g => ({ operator: g.operator, count: g._count._all, sum: g._sum.amount || 0 }))
    const ventas = byOperator(ventasPorOp)
    const reparaciones = byOperator(reparacionesPorOp)

    const result = await Promise.all(groupBy.map(async g => {
      // Calcular ganancia de reparaciones (pricePaid - cost/thirdPartyCost)
      const repairsGanancia = await prisma.repair.aggregate({
        where: {
          operator: g.operator,
          deletedAt: null,
          status: { in: ['DELIVERED', 'COMPLETED', 'THIRD_PARTY'] },
          ...(Object.keys(range).length ? { createdAt: range } : {}),
        },
        _sum: { profitReal: true },
      })

      // Calcular ganancia de ventas (usando profitReal del modelo Sale)
      const salesGanancia = await prisma.sale.aggregate({
        where: {
          operator: g.operator,
          status: 'COMPLETED',
          ...(Object.keys(range).length ? { createdAt: range } : {}),
        },
        _sum: { profitReal: true },
      })

      const totalGanancia = (repairsGanancia._sum.profitReal || 0) + (salesGanancia._sum.profit || 0)

      return {
        operador: g.operator,
        cantidadVentas: ventas.find(v => v.operator === g.operator)?.count || 0,
        facturacion: ventas.find(v => v.operator === g.operator)?.sum || 0,
        gananciaReparaciones: (repairsGanancia._sum.profitReal || 0),
        gananciaVentas: (salesGanancia._sum.profit || 0),
        gananciaTotal: totalGanancia,
        preventas: await prisma.accountingEntry.count({ where: { ...whereDate, source: 'PREORDER', operator: g.operator } }),
        reparaciones: reparaciones.find(r => r.operator === g.operator)?.count || 0,
        totalMovimientos: g._count._all,
      }
    }))

    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}