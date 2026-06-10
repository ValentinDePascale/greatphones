import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

function generateOrderCode() {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientName, clientDni, items, paymentMethod, cashReceived, adminId } = body

    if (!clientName || !clientDni || !items || items.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (!paymentMethod || !['cash', 'transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
    }

    if (paymentMethod === 'cash' && (!cashReceived || cashReceived <= 0)) {
      return NextResponse.json({ error: 'Monto recibido inválido' }, { status: 400 })
    }

    // Validate admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Calculate total and validate stock
    let subtotal = 0
    const catalogItems = items.filter((i: any) => i.type === 'catalog')
    const customItems = items.filter((i: any) => i.type === 'custom')

    // Validate stock for catalog products
    if (catalogItems.length > 0) {
      const productIds = catalogItems.map((i: any) => i.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      })

      const productMap = new Map(products.map(p => [p.id, p] as [string, typeof p]))

      for (const item of catalogItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          return NextResponse.json({ error: `Producto no encontrado: ${item.productId}` }, { status: 400 })
        }
        if (product.stock < item.quantity) {
          return NextResponse.json({
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
          }, { status: 400 })
        }
        subtotal += product.price * item.quantity
      }
    }

    // Add custom products
    customItems.forEach((item: any) => {
      subtotal += item.price * item.quantity
    })

    const total = subtotal

    // Validate cash payment
    let change = 0
    if (paymentMethod === 'cash') {
      if (cashReceived < total) {
        return NextResponse.json({
          error: 'Monto recibido insuficiente'
        }, { status: 400 })
      }
      change = cashReceived - total
    }

    // Generate order code
    const orderCode = generateOrderCode()

    // Create or find user for the client
    let user = await prisma.user.findFirst({
      where: { dni: clientDni }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${clientDni}@instore.greatphones.com`,
          name: clientName,
          dni: clientDni,
          role: 'CLIENT'
        }
      })
    }

    // Create order and update stock in transaction
    const order = await prisma.$transaction(async (tx) => {
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
          cashReceived: paymentMethod === 'cash' ? cashReceived : null,
          change: paymentMethod === 'cash' ? change : null,
          saleChannel: 'in-store',
          adminId,
          items: {
            create: items.map((item: any) => {
              if (item.type === 'catalog') {
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price
                }
              } else {
                return {
                  customName: item.name,
                  customPrice: item.price,
                  quantity: item.quantity,
                  price: item.price
                }
              }
            })
          }
        },
        include: {
          items: true
        }
      })

      // Update stock
      if (paymentMethod === 'cash') {
        for (const item of catalogItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              sold: { increment: item.quantity }
            }
          })
        }
      } else {
        // Reserve stock for transfer
        for (const item of catalogItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              reserved: { increment: item.quantity }
            }
          })
        }
      }

      return newOrder
    })

    // If transfer, generate QR
    if (paymentMethod === 'transfer') {
      const payment = new Payment(client)

      const paymentData = {
        transaction_amount: total,
        description: `Venta en tienda - ${orderCode}`,
        payment_method_id: 'mp_qr',
        payer: {
          email: 'instore@greatphones.com'
        },
        point_of_interaction: {
          type: 'OPENPLATFORM'
        },
        external_reference: orderCode,
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`
      }

      const mpResponse = await payment.create({ body: paymentData })

      // Update order with MP data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: mpResponse.id?.toString(),
          mpStatus: 'pending'
        }
      })

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderCode: order.code,
        qrCode: mpResponse.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        amount: total,
        mpPaymentId: mpResponse.id?.toString()
      })
    }

    // Cash payment - return order
    return NextResponse.json({
      success: true,
      order,
      change
    })

  } catch (error) {
    console.error('Error creating in-store sale:', error)
    return NextResponse.json({ error: 'Error al crear la venta' }, { status: 500 })
  }
}

// GET - In-store sales history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')

    const where: any = {
      saleChannel: 'in-store'
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
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching in-store sales:', error)
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 })
  }
}
