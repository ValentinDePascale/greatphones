import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

async function requireAdmin(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) }
  return { userId }
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = new Date(currentYear, now.getMonth(), 1)
    const lastMonth = new Date(currentYear, now.getMonth() - 1, 1)
    const nextMonth = new Date(currentYear, now.getMonth() + 1, 1)
    const startOfYear = new Date(currentYear, 0, 1)

    // KPIs - Current month (aggregate instead of findMany)
    const [currentAgg, lastAgg] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: currentMonth, lt: nextMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: lastMonth, lt: currentMonth } },
        _sum: { total: true },
        _count: true,
      }),
    ])

    const currentRevenue = currentAgg._sum.total || 0
    const currentOrderCount = currentAgg._count
    const lastRevenue = lastAgg._sum.total || 0
    const lastOrderCount = lastAgg._count

    // Ticket average
    const avgTicket = currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0
    const lastAvgTicket = lastOrderCount > 0 ? Math.round(lastRevenue / lastOrderCount) : 0

    // New users
    const [newUsers, lastNewUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: currentMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: currentMonth } } }),
    ])

    // Monthly stats - fetch orders and users for the year in parallel
    const [yearOrders, yearUsers] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfYear } },
        select: { total: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startOfYear } },
        select: { createdAt: true },
      }),
    ])

    // Index orders by month using Map for O(1) lookups
    const ordersByMonth = new Map<number, { revenue: number; orders: number }>()
    yearOrders.forEach((o) => {
      const monthIndex = new Date(o.createdAt).getMonth()
      const existing = ordersByMonth.get(monthIndex) || { revenue: 0, orders: 0 }
      existing.revenue += o.total || 0
      existing.orders++
      ordersByMonth.set(monthIndex, existing)
    })

    // Index users by month using Map for O(1) lookups
    const usersByMonth = new Map<number, number>()
    yearUsers.forEach((u) => {
      const monthIndex = new Date(u.createdAt).getMonth()
      usersByMonth.set(monthIndex, (usersByMonth.get(monthIndex) || 0) + 1)
    })

    // Build monthly stats with O(1) lookups instead of O(n) iterations
    const monthlyStats = MONTHS.map((month, i) => {
      const orderData = ordersByMonth.get(i) || { revenue: 0, orders: 0 }
      const userCount = usersByMonth.get(i) || 0
      return {
        month,
        monthIndex: i,
        revenue: orderData.revenue,
        orders: orderData.orders,
        avgTicket: orderData.orders > 0 ? Math.round(orderData.revenue / orderData.orders) : 0,
        newUsers: userCount,
      }
    })

    // Annual totals
    const annualRevenue = monthlyStats.reduce((sum, m) => sum + m.revenue, 0)
    const annualOrders = monthlyStats.reduce((sum, m) => sum + m.orders, 0)
    const annualAvgTicket = annualOrders > 0 ? Math.round(annualRevenue / annualOrders) : 0
    const annualUsers = monthlyStats.reduce((sum, m) => sum + m.newUsers, 0)

    // Recent orders, top products, and low stock - all independent, run in parallel
    const [recentOrders, topProducts, lowStockProducts, lowStockAccessories] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          clientName: true,
          clientEmail: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        orderBy: { sold: 'desc' },
        take: 3,
        where: { sold: { gt: 0 } },
        select: {
          id: true,
          name: true,
          sub: true,
          brand: true,
          sold: true,
          imageUrl: true,
          ico: true,
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 3 } },
        orderBy: { stock: 'asc' },
        take: 5,
        select: {
          id: true,
          name: true,
          brand: true,
          stock: true,
          imageUrl: true,
          ico: true,
        },
      }),
      prisma.accessory.findMany({
        where: { stock: { lte: 3 }, isActive: true },
        orderBy: { stock: 'asc' },
        take: 5,
        select: {
          id: true,
          name: true,
          brand: true,
          stock: true,
          imageUrl: true,
          ico: true,
        },
      }),
    ])

    // Order statuses distribution
    const orderStatuses = await Promise.all(
      ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(async (status) => {
        const count = await prisma.order.count({ where: { status: status as any } })
        return { status, count }
      })
    )

    // Sales by brand - optimized with groupBy
    const brandSalesData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    })

    const brandMap: Record<string, number> = {}
    const productIds = brandSalesData.map((b) => b.productId).filter((id): id is string => id !== null)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, brand: true },
    })
    const productBrandMap: Record<string, string> = {}
    products.forEach((p) => { productBrandMap[p.id] = p.brand || 'Otros' })

    brandSalesData.forEach((item) => {
      if (!item.productId) return
      const brand = productBrandMap[item.productId] || 'Otros'
      brandMap[brand] = (brandMap[brand] || 0) + (item._sum.quantity || 0)
    })

    const brandSales = Object.entries(brandMap)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // Calculate percentages
    const revenueChange = lastRevenue > 0 ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) : 0
    const ordersChange = lastOrderCount > 0 ? Math.round(((currentOrderCount - lastOrderCount) / lastOrderCount) * 100) : 0
    const ticketChange = lastAvgTicket > 0 ? Math.round(((avgTicket - lastAvgTicket) / lastAvgTicket) * 100) : 0
    const usersChange = lastNewUsers > 0 ? Math.round(((newUsers - lastNewUsers) / lastNewUsers) * 100) : 0

    return NextResponse.json({
      revenue: currentRevenue,
      revenueChange,
      orders: currentOrderCount,
      ordersChange,
      avgTicket,
      ticketChange,
      newUsers,
      usersChange,
      monthlyStats,
      annualStats: {
        revenue: annualRevenue,
        orders: annualOrders,
        avgTicket: annualAvgTicket,
        newUsers: annualUsers,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.code,
        client: o.clientName || o.clientEmail || 'N/A',
        total: o.total,
        status: o.status,
        date: o.createdAt.toISOString(),
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sub: p.sub,
        brand: p.brand,
        sold: p.sold,
        imageUrl: p.imageUrl,
        ico: p.ico,
      })),
      lowStock: [
        ...lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          stock: p.stock,
          imageUrl: p.imageUrl,
          ico: p.ico,
          type: 'producto',
        })),
        ...lowStockAccessories.map((a) => ({
          id: a.id,
          name: a.name,
          brand: a.brand || '',
          stock: a.stock,
          imageUrl: a.imageUrl,
          ico: a.ico || '📦',
          type: 'accesorio',
        })),
      ]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
      orderStatuses: orderStatuses.filter(s => s.count > 0),
      brandSales,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
