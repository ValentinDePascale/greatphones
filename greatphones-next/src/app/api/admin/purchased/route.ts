import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
    const search = searchParams.get('search') || ''
    const brand = searchParams.get('brand') || ''
    const condition = searchParams.get('condition') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { device: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientDni: { contains: search, mode: 'insensitive' } },
        { imei: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (brand) where.brand = brand
    if (condition) where.condition = condition

    const [items, total] = await Promise.all([
      prisma.purchasedDevice.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, type: true, number: true, pos: true, cae: true, total: true, createdAt: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchasedDevice.count({ where }),
    ])

    // Para métricas: total gastado, promedio, conteo por marca
    const aggregates = await prisma.purchasedDevice.aggregate({
      where,
      _sum: { purchasePrice: true },
      _avg: { purchasePrice: true },
    })

    return NextResponse.json({
      data: items.map(i => ({
        ...i,
        receivedAt: i.receivedAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        invoice: i.invoice
          ? {
              ...i.invoice,
              createdAt: i.invoice.createdAt.toISOString(),
            }
          : null,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      metrics: {
        totalSpent: aggregates._sum.purchasePrice || 0,
        avgSpent: Math.round(aggregates._avg.purchasePrice || 0),
      },
    })
  } catch (error) {
    console.error('[Purchased] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchased devices' }, { status: 500 })
  }
}
