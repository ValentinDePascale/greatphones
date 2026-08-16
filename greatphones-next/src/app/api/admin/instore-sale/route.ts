import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { productCache } from '@/lib/cache'
import { requireAdmin } from '@/lib/auth-guard'
import { reserveStock, releaseStock } from '@/lib/stock'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

function generateOrderCode() {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const {
      clientName,
      clientDni,
      clientCuil,
      clientPhone,
      clientAddress,
      clientEmail,
      items,
      paymentMethod,
      cashReceived,
      adminId,
      currency,
      installments,
      usdRate,
    } = body

    console.log(
      '[instore-sale] Body:',
      JSON.stringify({
        clientName,
        clientDni,
        paymentMethod,
        itemCount: items?.length,
        adminId,
        currency,
        installments,
      }),
    )

    if (!clientName || !clientDni || !items || items.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const unsafeText = [clientName, clientDni, clientCuil, clientPhone, clientAddress, clientEmail].find(
      (value) => typeof value === 'string' && /[<>]/.test(value),
    )
    if (unsafeText !== undefined) {
      return NextResponse.json({ error: 'Campos inválidos: no puede contener < o >' }, { status: 400 })
    }

    for (const item of items) {
      if (!['catalog', 'custom', 'inventory'].includes(item?.type)) {
        return NextResponse.json({ error: 'Tipo de ítem inválido' }, { status: 400 })
      }
      const qty = item.quantity
      if (
        qty !== undefined &&
        (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 99)
      ) {
        return NextResponse.json({ error: 'Cantidad de ítem inválida' }, { status: 400 })
      }
    }

    if (!paymentMethod || !['cash', 'transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
    }

    if (paymentMethod === 'cash' && (!cashReceived || cashReceived <= 0)) {
      return NextResponse.json({ error: 'Monto recibido inválido' }, { status: 400 })
    }

    if (currency && !['ARS', 'USD'].includes(currency)) {
      return NextResponse.json({ error: 'Moneda inválida' }, { status: 400 })
    }

    const installmentsCount = installments ? parseInt(installments) : 1
    if (installmentsCount < 1) {
      return NextResponse.json({ error: 'Cantidad de cuotas inválida' }, { status: 400 })
    }

    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Categorize items
    const catalogItems = items.filter((i: any) => i.type === 'catalog')
    const customItems = items.filter((i: any) => i.type === 'custom')
    const inventoryItems = items.filter((i: any) => i.type === 'inventory')

    // Calculate total and validate
    let subtotal = 0

    // Validate stock for catalog products
    if (catalogItems.length > 0) {
      const productIds = catalogItems.map((i: any) => i.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      })

      const productMap = new Map(products.map(p => [p.id, p] as [string, typeof p]))

      for (const item of catalogItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          return NextResponse.json(
            { error: `Producto no encontrado: ${item.productId}` },
            { status: 400 },
          )
        }
        if (product.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
            },
            { status: 400 },
          )
        }
        subtotal += product.price * item.quantity
      }
    }

    // Validate inventory items (must exist and be IN_STOCK)
    const inventoryItemRecords: any[] = []
    if (inventoryItems.length > 0) {
      const invIds = inventoryItems.map((i: any) => i.inventoryItemId)
      const invItems = await prisma.inventoryItem.findMany({
        where: { id: { in: invIds } },
        include: { product: true },
      })

      const invMap = new Map(invItems.map(i => [i.id, i]))

      for (const item of inventoryItems) {
        const invItem = invMap.get(item.inventoryItemId)
        if (!invItem) {
          return NextResponse.json(
            { error: `Dispositivo de inventario no encontrado` },
            { status: 400 },
          )
        }
        if (invItem.status !== 'IN_STOCK') {
          return NextResponse.json(
            {
              error: `El dispositivo ${invItem.code} no está disponible (estado: ${invItem.status})`,
            },
            { status: 400 },
          )
        }
        subtotal += item.price || invItem.targetPrice || invItem.purchasePrice
        inventoryItemRecords.push(invItem)
      }
    }

    // Add custom products
    customItems.forEach((item: any) => {
      subtotal += item.price * item.quantity
    })

    const total = subtotal
    const expectedAmount = installmentsCount > 1 ? Math.round(total / installmentsCount) : total

    // Validate cash payment
    let change = 0
    if (paymentMethod === 'cash') {
      if (cashReceived < expectedAmount) {
        return NextResponse.json(
          {
            error: 'Monto recibido insuficiente',
          },
          { status: 400 },
        )
      }
      change = cashReceived - expectedAmount
    }

    // Generate order code
    const orderCode = generateOrderCode()

    // Create or find user for the client
    let user = await prisma.user.findFirst({
      where: { dni: clientDni },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${clientDni}@instore.greatphones.com`,
          name: clientName,
          dni: clientDni,
          role: 'CLIENT',
        },
      })
    }

    // Create order and update stock in transaction
    const order = await prisma.$transaction(async tx => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          userId: user.id,
          status: paymentMethod === 'cash' ? 'DELIVERED' : 'PENDING',
          subtotal,
          total,
          payment: paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
          clientName,
          clientDni,
          clientCuil: clientCuil || null,
          clientPhone: clientPhone || null,
          clientAddress: clientAddress || null,
          clientEmail: clientEmail || null,
          cashReceived: paymentMethod === 'cash' ? cashReceived : null,
          change: paymentMethod === 'cash' ? change : null,
          currency: currency || 'ARS',
          cuotas: installmentsCount,
          saleChannel: 'in-store',
          adminId,
          items: {
            create: items.map((item: any) => {
              if (item.type === 'catalog') {
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                }
              } else if (item.type === 'inventory') {
                // Find the inventory item record to check for linked product
                const invRecord = inventoryItemRecords.find(r => r.id === item.inventoryItemId)
                if (invRecord?.productId) {
                  return {
                    productId: invRecord.productId,
                    quantity: 1,
                    price: item.price || invRecord.targetPrice || invRecord.purchasePrice,
                  }
                }
                return {
                  customName: invRecord
                    ? `${invRecord.brand} ${invRecord.modelName}`
                    : 'Dispositivo inventario',
                  customPrice:
                    item.price || invRecord?.targetPrice || invRecord?.purchasePrice || 0,
                  quantity: 1,
                  price: item.price || invRecord?.targetPrice || invRecord?.purchasePrice || 0,
                }
              } else {
                return {
                  customName: item.name,
                  customPrice: item.price,
                  quantity: item.quantity,
                  price: item.price,
                }
              }
            }),
          },
        },
        include: {
          items: true,
        },
      })

      if (paymentMethod === 'cash') {
        await reserveStock(
          tx,
          catalogItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        )
        await releaseStock(
          tx,
          catalogItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          orderCode,
        )
      } else {
        await reserveStock(
          tx,
          catalogItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        )
      }

      // Handle inventory items: mark as SOLD, update linked product stock, create history
      if (inventoryItems.length > 0) {
        for (let i = 0; i < inventoryItems.length; i++) {
          const invItem = inventoryItemRecords[i]
          const salePrice = inventoryItems[i].price || invItem.targetPrice || invItem.purchasePrice

          // Update inventory item status to SOLD
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: {
              status: 'SOLD',
              salePrice,
              soldAt: new Date(),
              soldById: adminId,
            },
          })

          // Decrement product stock if linked
          if (invItem.productId) {
            if (paymentMethod === 'cash') {
              await tx.product.update({
                where: { id: invItem.productId },
                data: {
                  stock: { decrement: 1 },
                  sold: { increment: 1 },
                },
              })
            } else {
              await tx.product.update({
                where: { id: invItem.productId },
                data: {
                  stock: { decrement: 1 },
                  reserved: { increment: 1 },
                },
              })
            }
          }

          // Create inventory history entry
          await tx.inventoryHistory.create({
            data: {
              inventoryItemId: invItem.id,
              type: 'SOLD',
              oldValue: 'IN_STOCK',
              newValue: 'SOLD',
              description: `Vendido en tienda — ${clientName} (${clientDni})${paymentMethod === 'cash' ? ' — Efectivo' : ' — Transferencia'}`,
              userId: adminId,
            },
          })
        }
      }

      await tx.paymentTransaction.create({
        data: {
          orderId: newOrder.id,
          amount: total,
          method: paymentMethod === 'transfer' ? 'transfer' : 'cash',
          status: paymentMethod === 'transfer' ? 'pending' : 'approved',
          installments: installmentsCount || 1,
        },
      })

      return newOrder
    })

    // Clear product cache so stock updates reflect immediately
    productCache.clear()

    // If transfer, generate QR
    if (paymentMethod === 'transfer') {
      const payment = new Payment(client)

      const paymentData = {
        transaction_amount: total,
        description: `Venta en tienda - ${orderCode}`,
        payment_method_id: 'mp_qr',
        payer: {
          email: 'instore@greatphones.com',
        },
        point_of_interaction: {
          type: 'OPENPLATFORM',
        },
        external_reference: orderCode,
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      }

      const mpResponse = await payment.create({ body: paymentData })

      // Update order with MP data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: mpResponse.id?.toString(),
          mpStatus: 'pending',
        },
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderCode: order.code,
        qrCode: mpResponse.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        amount: total,
        currency: currency || 'ARS',
        installments: installmentsCount,
        mpPaymentId: mpResponse.id?.toString(),
      })
    }

    // Cash payment - return order
    return NextResponse.json({
      success: true,
      order,
      change,
    })
  } catch (error) {
    console.error('Error creating in-store sale:', error)
    return NextResponse.json({ error: 'Error al crear la venta' }, { status: 500 })
  }
}

// GET - In-store sales history
export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')

    const where: any = {
      saleChannel: 'in-store',
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    if (paymentMethod) {
      where.payment = paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'
    }

    const total = await prisma.order.count({ where })

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        admin: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching in-store sales:', error)
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 })
  }
}
