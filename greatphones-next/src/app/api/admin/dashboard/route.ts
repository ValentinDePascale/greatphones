import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // KPIs - Current month
    const currentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: currentMonth, lt: nextMonth } },
      select: { total: true },
    })
    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.total, 0)
    const currentOrderCount = currentOrders.length

    // KPIs - Last month
    const lastOrders = await prisma.order.findMany({
      where: { createdAt: { gte: lastMonth, lt: currentMonth } },
      select: { total: true },
    })
    const lastRevenue = lastOrders.reduce((sum, o) => sum + o.total, 0)
    const lastOrderCount = lastOrders.length

    // Ticket average
    const avgTicket = currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0
    const lastAvgTicket = lastOrderCount > 0 ? Math.round(lastRevenue / lastOrderCount) : 0

    // New users
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: currentMonth } },
    })
    const lastNewUsers = await prisma.user.count({
      where: { createdAt: { gte: lastMonth, lt: currentMonth } },
    })

    // Recent orders
    const recentOrders = await prisma.order.findMany({
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
    })

    // Top products by sold count
    const topProducts = await prisma.product.findMany({
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
    })

    // Low stock products (stock <= 3)
    const lowStockProducts = await prisma.product.findMany({
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
    })

    // Low stock accessories
    const lowStockAccessories = await prisma.accessory.findMany({
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
    })

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
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
