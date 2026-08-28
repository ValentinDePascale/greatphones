import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { getCashBalances } from '@/lib/accounting'

/**
 * Reportes consolidados: TODOS los ingresos del sistema, de todos los
 * canales (online y local).
 *
 * Fuentes:
 *  - Caja: saldos por medio de pago (efectivo/transferencia/USD/cuotas).
 *  - Libro Diario (AccountingEntry): ingresos y egresos de todos los módulos
 *    (SALE/REPAIR/PREORDER/ONLINE/GASTO/...).
 *  - Pedidos online (Order): ventas pagadas de la tienda online.
 * Se agrupa por canal: ONLINE (web) vs LOCAL (local/tienda física).
 */
const ONLINE_SOURCES = ['ONLINE', 'PREORDER']
const LOCAL_INGRESO_SOURCES = ['SALE', 'REPAIR', 'PURCHASE']

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const range: { gte?: Date; lte?: Date } = {}
    if (desde) range.gte = new Date(desde + 'T00:00:00')
    if (hasta) range.lte = new Date(hasta + 'T23:59:59')
    const whereDate = Object.keys(range).length ? { opDate: range } : {}

    // 1) Saldos de caja (excluye anuladas)
    const anulados = await prisma.auditLog.findMany({
      where: { action: 'ANULACION' },
      select: { snapshot: true },
    })
    const anulledOps = new Set<string>()
    for (const a of anulados as any[]) {
      const snap = a.snapshot as any
      if (snap?.code) anulledOps.add(snap.code)
      if (snap?.id) anulledOps.add(snap.id)
    }

    const balancesRaw = await getCashBalances()
    // Recalcular balances excluyendo anuladas si hay
    let balances = balancesRaw
    if (anulledOps.size > 0) {
      const allEntriesForBalance = await prisma.accountingEntry.findMany({
        select: { means: true, amount: true, amountUsd: true, type: true, operationId: true },
      })
      const filtered = allEntriesForBalance.filter(
        e => !e.operationId || !anulledOps.has(e.operationId),
      )
      const map = new Map<string, { balance: number; balanceUsd: number | null }>()
      for (const e of filtered) {
        const cur = map.get(e.means) || { balance: 0, balanceUsd: 0 }
        const delta = e.type === 'INGRESO' ? e.amount : e.type === 'EGRESO' ? -e.amount : 0
        cur.balance += delta
        if (e.means === 'USD' && e.amountUsd != null) {
          const dUsd = e.type === 'INGRESO' ? e.amountUsd : e.type === 'EGRESO' ? -e.amountUsd : 0
          cur.balanceUsd = (cur.balanceUsd || 0) + dUsd
        }
        map.set(e.means, cur)
      }
      balances = Array.from(map.entries()).map(([means, v]) => ({
        means,
        balance: v.balance,
        balanceUsd: v.balanceUsd,
      }))
    }

    // 2) Consolidado de Libro Diario por source y tipo (excluye anuladas)
    const entriesRaw = await prisma.accountingEntry.findMany({
      where: { ...whereDate },
      select: {
        source: true,
        type: true,
        amount: true,
        amountUsd: true,
        means: true,
        operationId: true,
        description: true,
        operator: true,
        opDate: true,
        id: true,
        createdAt: true,
      },
      orderBy: { opDate: 'desc' },
    })
    const entries = entriesRaw.filter(e => !e.operationId || !anulledOps.has(e.operationId))

    const resumen = new Map<string, { ingresos: number; egresos: number; cantidad: number }>()
    for (const e of entries) {
      const key = e.source || 'OTRO'
      let r = resumen.get(key)
      if (!r) {
        r = { ingresos: 0, egresos: 0, cantidad: 0 }
        resumen.set(key, r)
      }
      if (e.type === 'INGRESO') r.ingresos += e.amount || 0
      if (e.type === 'EGRESO') r.egresos += e.amount || 0
      r.cantidad++
    }

    // 3) Pedidos online pagados (ventas web confirmadas)
    const pedidosOnline = await prisma.order.findMany({
      where: {
        ...(desde || hasta
          ? {
              createdAt: {
                ...(desde ? { gte: new Date(desde + 'T00:00:00') } : {}),
                ...(hasta ? { lte: new Date(hasta + 'T23:59:59') } : {}),
              },
            }
          : {}),
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        saleChannel: { not: 'instore' },
      },
      select: { total: true, status: true, saleChannel: true, code: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    const totalOnline = pedidosOnline.reduce((s, o) => s + (o.total || 0), 0)

    // 4) Totales por canal
    const onlineIngresos = entries
      .filter(e => ONLINE_SOURCES.includes(e.source) && e.type === 'INGRESO')
      .reduce((s, e) => s + (e.amount || 0), 0)
    const localIngresos = entries
      .filter(e => LOCAL_INGRESO_SOURCES.includes(e.source) && e.type === 'INGRESO')
      .reduce((s, e) => s + (e.amount || 0), 0)
    const localOtrosIngresos = entries
      .filter(
        e =>
          !ONLINE_SOURCES.includes(e.source) &&
          !LOCAL_INGRESO_SOURCES.includes(e.source) &&
          e.type === 'INGRESO',
      )
      .reduce((s, e) => s + (e.amount || 0), 0)
    const egresos = entries
      .filter(e => e.type === 'EGRESO')
      .reduce((s, e) => s + (e.amount || 0), 0)

    const canales = {
      online: {
        total: onlineIngresos,
        cantidad: entries.filter(e => ONLINE_SOURCES.includes(e.source) && e.type === 'INGRESO')
          .length,
      },
      local: {
        total: localIngresos,
        cantidad: entries.filter(
          e => LOCAL_INGRESO_SOURCES.includes(e.source) && e.type === 'INGRESO',
        ).length,
      },
      otros: {
        total: localOtrosIngresos,
        cantidad: entries.filter(
          e =>
            !ONLINE_SOURCES.includes(e.source) &&
            !LOCAL_INGRESO_SOURCES.includes(e.source) &&
            e.type === 'INGRESO',
        ).length,
      },
      egresos: { total: egresos, cantidad: entries.filter(e => e.type === 'EGRESO').length },
    }

    return NextResponse.json({
      balances,
      resumen: Array.from(resumen.entries()).map(([source, v]) => ({ source, ...v })),
      canales,
      pedidosOnline: {
        total: totalOnline,
        cantidad: pedidosOnline.length,
        items: pedidosOnline.slice(0, 50),
      },
      entries: entries.slice(0, 300),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
