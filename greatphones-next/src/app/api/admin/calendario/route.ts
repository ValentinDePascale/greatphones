import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

// Calendario de pendientes: TODO lo que está sin resolver, agrupado por día.
// Reparaciones, preventas, pedidos online, cotizaciones y arrepentimientos.
// Además: contadores globales como el dashboard del ERP (preventas
// pendientes/compradas, reparaciones abiertas) y el href de destino de cada
// pendiente para poder navegar con un clic.
export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes') // 'YYYY-MM'
    const c = mes ? new Date(mes + '-01T12:00:00') : new Date()
    const year = c.getFullYear()
    const month = c.getMonth()
    const inicio = new Date(year, month, 1, 0, 0, 0)
    const fin = new Date(year, month + 1, 1, 0, 0, 0)

    const iso = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    }

    const resumen: Record<string, Record<string, any[]>> = {}
    const push = (d: Date, tipo: string, item: any) => {
      const key = iso(d)
      if (!resumen[key]) resumen[key] = {}
      if (!resumen[key][tipo]) resumen[key][tipo] = []
      resumen[key][tipo].push(item)
    }

    // Contadores globales (mismo criterio que el dashboard del ERP)
    const [repAbiertas, prevPend, prevCompradas, cotizPend, arrPend, pedidosPend] = await Promise.all([
      prisma.repair.count({ where: { deletedAt: null, status: { in: ['PENDING', 'DIAGNOSIS', 'APPROVED', 'IN_PROGRESS'] } } }),
      prisma.preOrder.count({ where: { deletedAt: null, status: { in: ['PENDING'] } } }),
      prisma.preOrder.count({ where: { deletedAt: null, status: { in: ['PAID', 'CONFIRMED'] }, deliveredAt: null } }),
      prisma.quote.count({ where: { deletedAt: null, status: { in: ['PENDING', 'REVIEWING'] } } }),
      prisma.arrepentimiento.count({ where: { estado: 'PENDIENTE' } }),
      prisma.order.count({ where: { status: { in: ['PROCESSING', 'SHIPPED'] } } }),
    ])
    const contadores = {
      reparaciones: repAbiertas,
      preventasPendientes: prevPend,
      preventasCompradas: prevCompradas,
      cotizaciones: cotizPend,
      arrepentimientos: arrPend,
      pedidos: pedidosPend,
    }

    // 1) Reparaciones activas
    const reparaciones = await prisma.repair.findMany({
      where: { deletedAt: null, status: { in: ['PENDING', 'DIAGNOSIS', 'APPROVED', 'IN_PROGRESS'] }, createdAt: { gte: inicio, lt: fin } },
      orderBy: { createdAt: 'asc' },
    })
    for (const r of reparaciones) push(r.createdAt, 'Reparaciones', {
      id: r.id, codigo: r.code, titulo: r.device, subtitulo: r.clientName || r.operator || r.fault1 || '—',
      hora: r.createdAt.toISOString(), href: '/admin/reparaciones',
    })

    // 2) Preventas pendientes / por entregar
    const preventas = await prisma.preOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PENDING', 'PAID', 'CONFIRMED'] },
        OR: [
          { expectedDeliveryStart: { gte: inicio, lt: fin } },
          { expectedDeliveryEnd: { gte: inicio, lt: fin } },
          { createdAt: { gte: inicio, lt: fin } },
        ],
      },
      orderBy: { expectedDeliveryStart: 'asc' },
    })
    for (const p of preventas) {
      const fecha = p.expectedDeliveryStart || p.createdAt
      if (fecha >= inicio && fecha < fin) {
        const modelo = [p.productModelName, p.productStorage].filter(Boolean).join(' ')
        push(fecha, 'Preventas', {
          id: p.id, codigo: p.code, titulo: modelo || p.customName || 'Preventa',
          subtitulo: `${p.clientName || '—'}${p.productColor ? ' · ' + p.productColor : ''} · entrega hasta ${p.expectedDeliveryEnd ? p.expectedDeliveryEnd.toLocaleDateString('es-AR') : 'sin fecha'}`,
          hora: fecha.toISOString(),
          href: '/admin/preventa',
        })
      }
    }

    // 3) Pedidos online pendientes de entregar
    const pedidos = await prisma.order.findMany({
      where: {
        status: { in: ['PROCESSING', 'SHIPPED'] },
        OR: [{ createdAt: { gte: inicio, lt: fin } }, { shippedAt: { gte: inicio, lt: fin } }],
      },
      orderBy: { createdAt: 'asc' },
    })
    for (const o of pedidos) {
      const fecha = o.shippedAt || o.createdAt
      if (fecha >= inicio && fecha < fin) push(fecha, 'Pedidos', {
        id: o.id, codigo: o.code, titulo: `Pedido ${o.code}`,
        subtitulo: `${o.clientName || '—'} · ${o.status} · $${(o.total || 0).toLocaleString('es-AR')}`,
        hora: fecha.toISOString(), href: '/admin/pedidos',
      })
    }

    // 4) Cotizaciones pendientes
    const cotizaciones = await prisma.quote.findMany({
      where: { deletedAt: null, status: { in: ['PENDING', 'REVIEWING'] }, createdAt: { gte: inicio, lt: fin } },
      orderBy: { createdAt: 'asc' },
    })
    for (const q of cotizaciones) push(q.createdAt, 'Cotizaciones', {
      id: q.id, codigo: q.code, titulo: q.device || 'Cotización',
      subtitulo: `${q.clientName || '—'} · ${q.storage || ''} ${q.condition || ''} · ${q.status}`,
      hora: q.createdAt.toISOString(), href: '/admin/cotizaciones',
    })

    // 5) Arrepentimientos pendientes
    const arrepentimientos = await prisma.arrepentimiento.findMany({
      where: { estado: 'PENDIENTE', createdAt: { gte: inicio, lt: fin } },
      include: { order: { select: { code: true } } },
      orderBy: { createdAt: 'asc' },
    })
    for (const a of arrepentimientos) push(a.createdAt, 'Arrepentimientos', {
      id: a.id, codigo: a.order?.code || a.id.slice(0, 8), titulo: 'Arrepentimiento',
      subtitulo: `${a.email || '—'}${a.motivo ? ' · ' + a.motivo : ''}`,
      hora: a.createdAt.toISOString(), href: '/admin/arrepentimientos',
    })

    return NextResponse.json({ mes: iso(inicio).slice(0, 7), pendientes: resumen, contadores })
  } catch (error) {
    return handleRouteError(error)
  }
}