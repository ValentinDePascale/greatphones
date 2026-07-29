import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

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

    const total = await prisma.order.count({ where })

    const orders = await prisma.order.findMany({
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
      skip: (page - 1) * limit,
      take: limit
    })

    const totalRevenue = await prisma.order.aggregate({
      where: {
        ...where,
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
      },
      _sum: { total: true }
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [todayOrders, pendingOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } }
      }),
      prisma.order.count({
        where: { status: 'PENDING' }
      })
    ])

    return NextResponse.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders: total,
        todayOrders,
        pendingOrders
      }
    })

  } catch (error: any) {
    console.error('Error fetching sales history:', error)
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Error al obtener historial de ventas' }, { status: 500 })
  }
}
