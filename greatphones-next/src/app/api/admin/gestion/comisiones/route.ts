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

    const result = await Promise.all(groupBy.map(async g => ({
      operador: g.operator,
      cantidadVentas: ventas.find(v => v.operator === g.operator)?.count || 0,
      facturacion: ventas.find(v => v.operator === g.operator)?.sum || 0,
      ganancia: 0, // no calculada aún (requiere costos)
      preventas: await prisma.accountingEntry.count({ where: { ...whereDate, source: 'PREORDER', operator: g.operator } }),
      reparaciones: reparaciones.find(r => r.operator === g.operator)?.count || 0,
      totalMovimientos: g._count._all,
    })))

    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}