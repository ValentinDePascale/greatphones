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

    // Compras locales registradas en "Registrar Compra" (InventoryItem con código CMP-)
    const whereLocal: any = { code: { startsWith: 'CMP-' } }
    const searchConditions = []
    if (search) {
      searchConditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { modelName: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { imei: { contains: search, mode: 'insensitive' } },
        ]
      })
    }
    if (brand) {
      searchConditions.push({ brand })
    }
    if (condition) {
      searchConditions.push({ cosmeticCondition: condition })
    }
    if (searchConditions.length > 0) {
      whereLocal.AND = searchConditions
    }

    const [items, total, locales, totalLocales] = await Promise.all([
      prisma.purchasedDevice.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, type: true, number: true, pos: true, cae: true, total: true, createdAt: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: 0,
        take: 1000,
      }),
      prisma.purchasedDevice.count({ where }),
      prisma.inventoryItem.findMany({
        where: whereLocal,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 1000,
        select: {
          id: true,
          code: true,
          imei: true,
          brand: true,
          modelName: true,
          storage: true,
          color: true,
          cosmeticCondition: true,
          purchasePrice: true,
          purchasedFrom: true,
          purchaseDate: true,
          createdAt: true,
          serialNumber: true,
        },
      }),
      prisma.inventoryItem.count({ where: whereLocal }),
    ])

    // Combinar y ordenar por fecha desc (online → PurchasedDevice, local → InventoryItem)
    const online = items.map(i => ({
      id: i.id,
      code: i.code,
      source: 'online',
      brand: i.brand,
      device: i.device,
      storage: i.storage,
      condition: i.condition,
      color: i.color,
      batteryHealth: i.batteryHealth,
      imei: i.imei,
      serialNumber: i.serialNumber,
      clientName: i.clientName,
      clientDni: i.clientDni,
      clientPhone: i.clientPhone,
      clientCity: i.clientCity,
      clientProvince: i.clientProvince,
      purchasePrice: i.purchasePrice,
      invoiceId: i.invoiceId,
      receivedAt: i.receivedAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
      invoice: i.invoice
        ? { ...i.invoice, createdAt: i.invoice.createdAt.toISOString() }
        : null,
      createdBy: i.createdBy,
    }))
    const local = locales.map(l => ({
      id: l.id,
      code: l.code,
      source: 'local',
      brand: l.brand,
      device: l.modelName,
      storage: l.storage || '—',
      condition: l.cosmeticCondition,
      color: l.color,
      batteryHealth: null,
      imei: l.imei,
      serialNumber: l.serialNumber,
      clientName: l.purchasedFrom || 'Local',
      clientDni: null,
      clientPhone: null,
      clientCity: null,
      clientProvince: null,
      purchasePrice: l.purchasePrice,
      invoiceId: null,
      receivedAt: l.purchaseDate ? l.purchaseDate.toISOString() : l.createdAt.toISOString(),
      createdAt: l.createdAt.toISOString(),
      invoice: null,
      createdBy: null,
    }))

    const merged = [...online, ...local].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    const startIdx = (page - 1) * limit
    const pageData = merged.slice(startIdx, startIdx + limit)
    const combinedTotal = total + totalLocales
    const totalPages = Math.ceil(combinedTotal / limit)

    // Para métricas: total gastado, promedio (score: online + local)
    const [aggrOnline, aggrLocal] = await Promise.all([
      prisma.purchasedDevice.aggregate({ where, _sum: { purchasePrice: true }, _avg: { purchasePrice: true } }),
      prisma.inventoryItem.aggregate({ where: whereLocal, _sum: { purchasePrice: true }, _avg: { purchasePrice: true } }),
    ])
    const totalSpent = (aggrOnline._sum.purchasePrice || 0) + (aggrLocal._sum.purchasePrice || 0)
    const avgOnline = aggrOnline._avg.purchasePrice || 0
    const avgLocal = aggrLocal._avg.purchasePrice || 0
    const cntOnline = online.length
    const cntLocal = local.length
    const avgSpent = cntOnline + cntLocal > 0 ? Math.round(((avgOnline * cntOnline || 0) + (avgLocal * cntLocal || 0)) / (cntOnline + cntLocal)) : 0

    return NextResponse.json({
      data: pageData,
      page,
      limit,
      total: combinedTotal,
      totalPages,
      metrics: { totalSpent, avgSpent },
    })
  } catch (error) {
    console.error('[Purchased] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchased devices' }, { status: 500 })
  }
}
