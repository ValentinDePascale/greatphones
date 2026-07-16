import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const WARRANTY_COST_MAP: Record<string, number> = {
  '90 días': 0,
  '+12 meses': 85000,
  '+24 meses': 150000,
}

function getEffectivePrice(product: any): number {
  if (product.isOffer && product.discount && product.discount > 0) {
    const now = new Date()
    const start = product.offerStart ? new Date(product.offerStart) : null
    const end = product.offerEnd ? new Date(product.offerEnd) : null
    if ((!start || start <= now) && (!end || end >= now)) {
      return Math.round(product.price * (1 - product.discount / 100))
    }
  }
  return product.price
}

function generateOrderCode() {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      items, email, phone, street, number, floor, zip, city, province, document,
      warranty, cuotas,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    // Fetch products from DB
    const productIds = items.map((item: any) => item.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    // Build enriched items with server-side prices
    const enrichedItems = items.map((item: any) => {
      const product = productMap.get(item.id)
      if (!product) throw { status: 400, message: `Producto no encontrado: ${item.name}` }
      if (product.stock < item.quantity) {
        throw { status: 400, message: `Stock insuficiente para ${item.name}` }
      }
      const unitPrice = getEffectivePrice(product)
      return { ...item, product, unitPrice }
    })

    // Recalculate totals server-side
    const calculatedSubtotal = enrichedItems.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0)
    const calculatedWarrantyCost = WARRANTY_COST_MAP[warranty] ?? 0
    const calculatedTotal = calculatedSubtotal + calculatedWarrantyCost + (body.deliveryCost || 0)

    // Cross-check: reject if frontend total doesn't match
    if (body.total !== calculatedTotal) {
      return NextResponse.json({ error: 'Error de validación: el total no coincide.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock wallet row
      const walletRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "Wallet" WHERE "userId" = $1 FOR UPDATE',
        session.user.id
      )

      let wallet: any
      if (!walletRows || walletRows.length === 0) {
        wallet = await tx.wallet.create({
          data: { userId: session.user.id }
        })
      } else {
        wallet = await tx.wallet.findUnique({ where: { id: walletRows[0].id } })
      }

      if (!wallet || wallet.balance < calculatedTotal) {
        throw { status: 400, message: 'Saldo insuficiente' }
      }

      // Reserve stock with server-side product data
      for (const item of enrichedItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          }
        })
      }

      // Deduct from wallet
      const balanceBefore = wallet.balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: calculatedTotal },
          totalSpent: { increment: calculatedTotal },
        }
      })

      const orderCode = generateOrderCode()
      const order = await tx.order.create({
        data: {
          code: orderCode,
          userId: session.user.id,
          status: 'PROCESSING',
          payment: 'wallet',
          warranty: warranty || '90 dias',
          cuotas: cuotas || 1,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          warrantyCost: calculatedWarrantyCost,
          deliveryCost: body.deliveryCost || 0,
          clientEmail: email,
          clientPhone: phone,
          clientDni: document,
          shippingStreet: street,
          shippingNumber: number,
          shippingFloor: floor,
          shippingZip: zip,
          shippingCity: city,
          shippingProvince: province,
          items: {
            create: enrichedItems.map((item: any) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.unitPrice
            }))
          }
        }
      })

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: -calculatedTotal,
          balanceBefore,
          balanceAfter: balanceBefore - calculatedTotal,
          referenceId: order.id,
          description: `Pago de orden ${orderCode}`,
        }
      })

      return { orderId: order.id, orderCode }
    })

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderCode: result.orderCode,
      redirectUrl: `/success?wext=${result.orderCode}`
    })

  } catch (error: any) {
    if (error.status && error.message) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Wallet Pay] Error:', error)
    return NextResponse.json({ error: 'Error al procesar el pago con saldo' }, { status: 500 })
  }
}
