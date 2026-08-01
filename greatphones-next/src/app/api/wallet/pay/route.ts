import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, handleRouteError } from '@/lib/auth-guard'
import { reserveStock } from '@/lib/stock'
import { getEffectivePrice, generateOrderCode, WARRANTY_COST_MAP } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request)

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

    // Validate IMEI items
    const imeiMap = new Map<string, any>();
    const imeiItems = items.filter((item: any) => item.imei);
    if (imeiItems.length > 0) {
      const imeis = imeiItems.map((item: any) => item.imei);
      const inventoryUnits = await prisma.inventoryItem.findMany({
        where: { imei: { in: imeis } },
        select: { id: true, imei: true, productId: true, status: true },
      });
      for (const unit of inventoryUnits) imeiMap.set(unit.imei, unit);

      for (const item of imeiItems) {
        const unit = imeiMap.get(item.imei);
        if (!unit) {
          throw { status: 400, message: `IMEI no encontrado: ${item.imei}` };
        }
        if (unit.productId !== item.id) {
          throw { status: 400, message: `El IMEI ${item.imei} no pertenece al producto ${item.name}` };
        }
        if (unit.status !== 'IN_STOCK') {
          throw { status: 400, message: `El equipo ${item.imei} no está disponible (${unit.status})` };
        }
      }
    }

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
    const safeDeliveryCost = Math.max(0, body.deliveryCost || 0)
    const calculatedTotal = calculatedSubtotal + calculatedWarrantyCost + safeDeliveryCost

    // Cross-check: reject if frontend total doesn't match
    if (body.total !== calculatedTotal) {
      return NextResponse.json({ error: 'Error de validación: el total no coincide.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock wallet row
      const walletRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "Wallet" WHERE "userId" = $1 FOR UPDATE',
        user.id
      )

      let wallet: any
      if (!walletRows || walletRows.length === 0) {
        wallet = await tx.wallet.create({
          data: { userId: user.id }
        })
      } else {
        wallet = await tx.wallet.findUnique({ where: { id: walletRows[0].id } })
      }

      if (!wallet || wallet.balance < calculatedTotal) {
        throw { status: 400, message: 'Saldo insuficiente' }
      }

      await reserveStock(tx, enrichedItems.map((item: any) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })))

      // Deduct from wallet
      const balanceBefore = wallet.balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: calculatedTotal },
          totalSpent: { increment: calculatedTotal },
        }
      })

      // Reserve IMEI units
      const itemInventoryMap = new Map<string, string>();
      for (const item of enrichedItems) {
        if (item.imei && imeiMap.has(item.imei)) {
          const unit = imeiMap.get(item.imei);
          await tx.inventoryItem.update({
            where: { id: unit.id },
            data: {
              status: 'RESERVED',
              salePrice: item.unitPrice,
            },
          });
          itemInventoryMap.set(item.imei, unit.id);
        }
      }

      const orderCode = generateOrderCode()
      const order = await tx.order.create({
        data: {
          code: orderCode,
          userId: user.id,
          status: 'PROCESSING',
          payment: 'wallet',
          warranty: warranty || '90 dias',
          cuotas: cuotas || 1,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          warrantyCost: calculatedWarrantyCost,
          deliveryCost: safeDeliveryCost,
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
              inventoryItemId: item.imei ? (itemInventoryMap.get(item.imei) || null) : null,
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

      // Payment ledger
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          amount: calculatedTotal,
          method: 'wallet',
          status: 'approved',
          installments: 1,
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
    return handleRouteError(error)
  }
}
