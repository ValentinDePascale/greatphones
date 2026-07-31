import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  InventoryCreateSchema,
  formatZodError
} from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { productCache } from '@/lib/cache'
import QRCode from 'qrcode'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-guard'

const API_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

async function generateCode(): Promise<string> {
  const last = await prisma.inventoryItem.findFirst({
    orderBy: { code: 'desc' },
    select: { code: true }
  })
  let num = 1
  if (last) {
    const match = last.code.match(/CMP-(\d+)/)
    if (match) num = parseInt(match[1]) + 1
  }
  return `CMP-${String(num).padStart(3, '0')}`
}

function generateSpecs(data: any) {
  const specs: Record<string, any> = {}
  if (data.specs) return data.specs
  if (data.storage) specs.almacenamiento = data.storage
  if (data.color) specs.color = data.color
  return specs
}

async function reuseOrphanedItem(existing: any, data: any, origin: string | null, corsHeaders: HeadersInit) {
  // Find or create a Product for this orphaned item
  let productId: string | null = null
  if (data.brand && data.modelName) {
    const productMatch = await prisma.product.findFirst({
      where: {
        brand: data.brand,
        modelGroup: data.modelName,
        storage: data.storage || null,
        color: data.color || null,
      }
    })
    if (productMatch) {
      productId = productMatch.id
    } else {
      const newProduct = await prisma.product.create({
        data: {
          name: data.modelName,
          brand: data.brand,
          sub: [data.storage, data.color].filter(Boolean).join(' / ') || null,
          modelGroup: data.modelName,
          condition: data.cosmeticCondition || 'Impecable',
          price: data.targetPrice || 0,
          cost: data.purchasePrice || 0,
          stock: 0,
          type: data.deviceType || 'celular',
          storage: data.storage || null,
          color: data.color || null,
          battery: data.batteryHealth || null,
          imageUrl: data.imageUrl || null,
          ram: data.ram || null,
          screen: data.screen || null,
          imei: data.imei,
          ico: '📱',
        }
      })
      productId = newProduct.id
      await prisma.productLog.create({
        data: {
          productId: newProduct.id,
          name: newProduct.name,
          brand: newProduct.brand,
          price: newProduct.price,
          cost: newProduct.cost,
          stock: newProduct.stock,
          condition: newProduct.condition,
          type: newProduct.type,
          color: newProduct.color,
          storage: newProduct.storage,
          ram: newProduct.ram,
          battery: newProduct.battery,
          imei: newProduct.imei,
          source: 'inventory',
        },
      })
    }
  }
  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: 1 } }
    }).catch(() => {})
  }

  // Resolve createdById
  let resolvedUserId = data.createdById
  if (!resolvedUserId) {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
    if (firstUser) resolvedUserId = firstUser.id
  }
  if (resolvedUserId) {
    const userExists = await prisma.user.findUnique({ where: { id: resolvedUserId }, select: { id: true } })
    if (!userExists) resolvedUserId = undefined
  }
  if (!resolvedUserId) {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
    if (firstUser) resolvedUserId = firstUser.id
  }

  // Update the orphaned item with new data
  const updated = await prisma.inventoryItem.update({
    where: { id: existing.id },
    data: {
      brand: data.brand || existing.brand,
      modelName: data.modelName || existing.modelName,
      storage: data.storage ?? existing.storage,
      color: data.color ?? existing.color,
      modelNumber: data.modelNumber ?? existing.modelNumber,
      deviceType: data.deviceType || existing.deviceType,
      specs: data.specs ?? existing.specs,
      imageUrl: data.imageUrl ?? existing.imageUrl,
      purchasePrice: data.purchasePrice,
      cosmeticCondition: data.cosmeticCondition || 'Impecable',
      functionalCondition: data.functionalCondition ?? existing.functionalCondition,
      batteryHealth: data.batteryHealth ?? existing.batteryHealth,
      notes: data.notes ?? existing.notes,
      investor: data.investor ?? existing.investor,
      targetPrice: data.targetPrice ?? existing.targetPrice,
      productId,
    }
  })

  // History entry
  await prisma.inventoryHistory.create({
    data: {
      inventoryItemId: updated.id,
      type: 'UPDATED',
      description: `Dispositivo re-vinculado desde IMEI ${data.imei} ${productId ? '— vinculado a nuevo catálogo' : ''}`,
      userId: resolvedUserId!,
    }
  })

  // Save TAC to cache
  const tac = data.imei.substring(0, 8)
  prisma.tacCache.upsert({
    where: { tac },
    update: { hitCount: { increment: 1 } },
    create: {
      tac,
      brand: data.brand || '',
      modelName: data.modelName || '',
      storage: data.storage || null,
      color: data.color || null,
      modelNumber: data.modelNumber || null,
      deviceType: data.deviceType || 'celular',
      imageUrl: data.imageUrl || null,
      specs: Prisma.DbNull,
    }
  }).catch(() => {})

  productCache.clear()
  return NextResponse.json(updated, { status: 200, headers: corsHeaders })
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const imei = searchParams.get('imei')
    const code = searchParams.get('code')
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (status) where.status = status
    if (imei) where.imei = imei
    if (code) where.code = code
    if (productId) where.productId = productId
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { imei: { contains: search } },
        { brand: { contains: search, mode: 'insensitive' } },
        { modelName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.inventoryItem.count({ where })
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, price: true } },
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const body = await request.json()
    const validation = InventoryCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const data = validation.data

    // Check if IMEI already exists
    const existing = await prisma.inventoryItem.findUnique({ where: { imei: data.imei } })
    if (existing) {
      if (existing.productId) {
        return NextResponse.json({ error: 'El IMEI ya existe en el inventario' }, { status: 409, headers: corsHeaders })
      }
      // Orphaned item (product was deleted). Reuse it by updating with new data.
      return await reuseOrphanedItem(existing, data, origin, corsHeaders)
    }

    // Generate unique code
    const code = await generateCode()

    // Use provided productId or find/create matching Product
    let productId: string | null = data.productId || null
    if (!productId && data.brand && data.modelName) {
      const productMatch = await prisma.product.findFirst({
        where: {
          brand: data.brand,
          modelGroup: data.modelName,
          storage: data.storage || null,
          color: data.color || null,
        }
      })

      if (productMatch) {
        productId = productMatch.id
      } else {
        // Create new product
        const newProduct = await prisma.product.create({
          data: {
            name: data.modelName,
            brand: data.brand,
            sub: [data.storage, data.color].filter(Boolean).join(' / ') || null,
            modelGroup: data.modelName,
            condition: data.cosmeticCondition || 'Impecable',
            price: data.targetPrice || 0,
            cost: data.purchasePrice || 0,
            stock: 0,
            type: data.deviceType || 'celular',
            storage: data.storage || null,
            color: data.color || null,
            battery: data.batteryHealth || null,
            imageUrl: data.imageUrl || null,
            ram: data.ram || null,
            screen: data.screen || null,
            imei: data.imei,
            ico: '📱',
          }
        })
        productId = newProduct.id
        await prisma.productLog.create({
          data: {
            productId: newProduct.id,
            name: newProduct.name,
            brand: newProduct.brand,
            price: newProduct.price,
            cost: newProduct.cost,
            stock: newProduct.stock,
            condition: newProduct.condition,
            type: newProduct.type,
            color: newProduct.color,
            storage: newProduct.storage,
            ram: newProduct.ram,
            battery: newProduct.battery,
            imei: newProduct.imei,
            source: 'inventory',
          },
        })
      }
    }
    // Increment product stock when linking to existing product
    if (productId) {
      try {
        await prisma.product.update({
          where: { id: productId },
          data: { stock: { increment: 1 } }
        })
      } catch (e) {
        // Product might not exist
      }
    }

    // Resolve createdById
    let resolvedUserId = data.createdById
    if (!resolvedUserId) {
      const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
      if (firstUser) resolvedUserId = firstUser.id
    }
    if (resolvedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: resolvedUserId }, select: { id: true } })
      if (!userExists) resolvedUserId = undefined
    }
    if (!resolvedUserId) {
      const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
      if (firstUser) resolvedUserId = firstUser.id
    }

    // Generate QR
    const qrUrl = `${API_URL}/inv/${code}`
    const qrCode = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        code,
        imei: data.imei,
        serialNumber: data.serialNumber,
        brand: data.brand || '',
        modelName: data.modelName || '',
        storage: data.storage,
        color: data.color,
        modelNumber: data.modelNumber,
        deviceType: data.deviceType || 'celular',
        specs: generateSpecs(data),
        imageUrl: data.imageUrl,
        purchasePrice: data.purchasePrice,
        cosmeticCondition: data.cosmeticCondition || 'Impecable',
        functionalCondition: data.functionalCondition,
        batteryHealth: data.batteryHealth,
        notes: data.notes,
        investor: data.investor,
        targetPrice: data.targetPrice,
        productId,
        supplierId: data.supplierId,
        purchasedFrom: data.purchasedFrom,
        qrCode,
        createdById: resolvedUserId!,
      }
    })

    // Create history entry
    await prisma.inventoryHistory.create({
      data: {
        inventoryItemId: item.id,
        type: 'CREATED',
        description: `Dispositivo creado desde IMEI ${data.imei}${productId ? ' — vinculado a catálogo' : ''}`,
        userId: body.createdById,
      }
    })

    // Save TAC to cache for future auto-fill
    const tac = data.imei.substring(0, 8)
    prisma.tacCache.upsert({
      where: { tac },
      update: { hitCount: { increment: 1 } },
      create: {
        tac,
        brand: data.brand || '',
        modelName: data.modelName || '',
        storage: data.storage || null,
        color: data.color || null,
        modelNumber: data.modelNumber || null,
        deviceType: data.deviceType || 'celular',
        imageUrl: data.imageUrl || null,
        specs: Prisma.DbNull,
      }
    }).catch(() => {})

    productCache.clear()
    return NextResponse.json(item, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Error al crear item de inventario' }, { status: 500, headers: corsHeaders })
  }
}
