import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const MEAN_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CUOTAS: 'Cuotas',
  USD: 'USD',
  PAGO_ONLINE: 'Online',
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const saleChannel = searchParams.get('saleChannel')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    if (saleChannel && saleChannel !== 'all') {
      where.saleChannel = saleChannel
    }

    if (paymentMethod && paymentMethod !== 'all') {
      if (paymentMethod === 'cash') where.payment = 'Efectivo'
      else if (paymentMethod === 'transfer') where.payment = { contains: 'Transferencia' }
      else if (paymentMethod === 'mp') where.payment = { contains: 'Mercado' }
      else if (paymentMethod === 'card') where.payment = { contains: 'Tarjeta' }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientDni: { contains: search } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search } },
      ]
    }

    // Ventas locales (Registrar Venta) y preventas entregadas, aplicando los
    // mismos filtros de fecha y búsqueda.
    const whereVentas: any = { source: 'VENTA', type: 'INGRESO' }
    const wherePre: any = { status: 'DELIVERED' }
    if (startDate || endDate) {
      whereVentas.opDate = {}
      if (startDate) whereVentas.opDate.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereVentas.opDate.lte = end
      }
      wherePre.deliveredAt = {}
      if (startDate) wherePre.deliveredAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        wherePre.deliveredAt.lte = end
      }
    }
    if (search) {
      whereVentas.OR = [
        { operationId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
      wherePre.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, totalVentas, totalPre] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, imageUrl: true, ico: true }
              }
            }
          },
          admin: {
            select: { name: true, email: true }
          },
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3000,
      }),
      prisma.accountingEntry.findMany({
        where: whereVentas,
        select: { id: true, operationId: true, description: true, means: true, amount: true, amountUsd: true, opDate: true, operator: true },
        orderBy: { opDate: 'desc' },
        take: 3000,
      }),
      prisma.preOrder.findMany({
        where: wherePre,
        select: { id: true, code: true, clientName: true, clientDni: true, clientPhone: true, price: true, deliveredAt: true, createdAt: true },
        orderBy: { deliveredAt: 'desc' },
        take: 3000,
      }),
    ])

    const usdRate = (global as unknown as { dolarVenta?: number }).dolarVenta || 1000
    const ventasLocales = totalVentas.map(e => ({
      id: 'vta-' + e.id,
      _ts: new Date(e.opDate).getTime(),
      code: e.operationId || e.id,
      saleChannel: 'in-store',
      status: 'DELIVERED',
      clientName: 'Venta local',
      clientDni: null,
      clientEmail: null,
      clientPhone: null,
      payment: MEAN_LABEL[e.means] || e.means,
      total: (e.amount || 0) + Math.round((e.amountUsd || 0) * usdRate),
      currency: e.amountUsd ? 'USD' : 'ARS',
      cuotas: 0,
      createdAt: e.opDate,
      operator: e.operator || null,
      items: [{ id: e.id, quantity: 1, price: e.amount || 0 }],
      admin: { name: e.operator || 'Local', email: '' },
      user: null,
    }))
    const preventasEntregadas = totalPre.map(p => ({
      id: 'pre-' + p.id,
      _ts: new Date(p.deliveredAt || p.createdAt).getTime(),
      code: p.code,
      saleChannel: 'in-store',
      status: 'DELIVERED',
      clientName: p.clientName,
      clientDni: p.clientDni,
      clientEmail: null,
      clientPhone: p.clientPhone,
      payment: 'Preventa (entrega)',
      total: p.price || 0,
      currency: 'ARS',
      cuotas: 0,
      createdAt: p.deliveredAt || p.createdAt,
      operator: null,
      items: [{ id: p.id, quantity: 1, price: p.price || 0 }],
      admin: { name: 'Local', email: '' },
      user: null,
    }))

    const all = [
      ...orders.map(o => ({ ...o, _ts: new Date(o.createdAt).getTime() })),
      ...ventasLocales,
      ...preventasEntregadas,
    ].sort((a, b) => b._ts - a._ts)

    const total = all.length
    const pageData = all.slice((page - 1) * limit, page * limit)

    const statusesValidos = ['DELIVERED', 'SHIPPED', 'PROCESSING']
    const revenueOrders = orders
      .filter(o => statusesValidos.includes(o.status))
      .reduce((s, o) => s + (o.total || 0), 0)
    const revenueVentas = ventasLocales.reduce((s, v) => s + v.total, 0)
    const revenuePre = preventasEntregadas.reduce((s, v) => s + v.total, 0)
    const totalRevenue = revenueOrders + revenueVentas + revenuePre

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayOrders = all.filter(x => {
      const t = new Date(x.createdAt as string | Date).getTime()
      return t >= todayStart.getTime() && t <= todayEnd.getTime()
    }).length
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } })

    return NextResponse.json({
      data: pageData,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalRevenue,
        totalOrders: total,
        todayOrders,
        pendingOrders,
      },
    })

  } catch (error) {
    console.error('Error fetching sales history:', error)
    const msg = (error instanceof Error ? error.message : (error as { message?: string })?.message) || 'Error al obtener historial de ventas';
    const status = (error as { status?: number })?.status || 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: msg }, { status })
    }
    return NextResponse.json({ error: 'Error al obtener historial de ventas' }, { status: 500 })
  }
}
