import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

// Días y pendientes del mes: reparaciones, preventas y pedidos online.
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

    const resumen: Record<string, { reparaciones: any[]; preventas: any[]; pedidos: any[] }> = {}
    const dia = (d: Date) => {
      const key = iso(d)
      if (!resumen[key]) resumen[key] = { reparaciones: [], preventas: [], pedidos: [] }
      return resumen[key]
    }

    // Reparaciones activas (ingreso / diagnóstico / en curso)
    const reparaciones = await prisma.repair.findMany({
      where: { deletedAt: null, status: { in: ['PENDING', 'DIAGNOSIS', 'APPROVED', 'IN_PROGRESS'] }, createdAt: { gte: inicio, lt: fin } },
      orderBy: { createdAt: 'asc' },
    })
    for (const r of reparaciones) {
      const d = dia(r.createdAt)
      d.reparaciones.push({
        id: r.id, codigo: r.code, titulo: r.device,
        subtitulo: r.clientName || r.operator || r.fault1 || '—',
        hora: r.createdAt.toISOString(),
      })
    }

    // Preventas pendientes (entrega estimada dentro del mes)
    const preventas = await prisma.preOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'CART'] },
        OR: [
          { expectedDeliveryStart: { gte: inicio, lt: fin } },
          { expectedDeliveryEnd: { gte: inicio, lt: fin } },
          { createdAt: { gte: inicio, lt: fin } },
        ],
      },
      orderBy: { expectedDeliveryStart: 'asc' },
    })
    for (const p of preventas) {
      // Anclar al inicio estimado si existe; sino a la creación.
      const fecha = p.expectedDeliveryStart || p.createdAt
      if (fecha >= inicio && fecha < fin) {
        const d = dia(fecha)
        const modelo = [p.productModelName, p.productStorage].filter(Boolean).join(' ')
        d.preventas.push({
          id: p.id, codigo: p.code, titulo: modelo || p.productModelName || p.customName || 'Preventa',
          subtitulo: `${p.clientName || '—'} · entrega hasta ${p.expectedDeliveryEnd ? p.expectedDeliveryEnd.toLocaleDateString('es-AR') : 'sin fecha'}`,
          hora: fecha.toISOString(),
        })
      }
    }

    // Pedidos online procesando / enviados (pendientes de entregar)
    const pedidos = await prisma.order.findMany({
      where: {
        status: { in: ['PROCESSING', 'SHIPPED'] },
        OR: [
          { createdAt: { gte: inicio, lt: fin } },
          { shippedAt: { gte: inicio, lt: fin } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })
    for (const o of pedidos) {
      const fecha = o.shippedAt || o.createdAt
      if (fecha >= inicio && fecha < fin) {
        const d = dia(fecha)
        d.pedidos.push({
          id: o.id, codigo: o.code, titulo: `Pedido ${o.code}`,
          subtitulo: `${o.clientName || '—'} · ${o.status} · $${(o.total || 0).toLocaleString('es-AR')}`,
          hora: fecha.toISOString(),
        })
      }
    }

    return NextResponse.json({ mes: iso(inicio).slice(0, 7), pendientes: resumen })
  } catch (error) {
    return handleRouteError(error)
  }
}