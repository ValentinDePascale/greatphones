import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendArrepentimientoEmail, sendArrepAcceptEmail, sendArrepRejectEmail } from '@/lib/email'
import { requireSession, requireAdmin } from '@/lib/auth-guard'

function generateCouponCode(prefix: string) {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${ts}-${rnd}`
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const list = await prisma.arrepentimiento.findMany({
      include: {
        order: {
          select: {
            code: true,
            total: true,
            clientEmail: true,
            clientDni: true,
            clientPhone: true,
            shippingStreet: true,
            shippingNumber: true,
            shippingCity: true,
            shippingProvince: true,
            arrepReason: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const transformed = list.map(item => ({
      ...item,
      orderCode: item.order?.code || null,
      orderTotal: item.order?.total || null,
      orderDni: item.order?.clientDni || null,
      orderPhone: item.order?.clientPhone || null,
      reason: item.order?.arrepReason || null,
      orderShipping: item.order ? {
        street: item.order.shippingStreet,
        number: item.order.shippingNumber,
        city: item.order.shippingCity,
        province: item.order.shippingProvince,
      } : null,
    }))
    
    return NextResponse.json(transformed)
  } catch (e) {
    console.error('[ARREPENTIMIENTO] Error fetching:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { estado, rejectReason } = body
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 })
    }
    
    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
      return NextResponse.json({ success: false, message: 'Estado invalido' }, { status: 400 })
    }

    const arrep = await prisma.arrepentimiento.findUnique({
      where: { id },
      include: { order: true }
    })

    if (!arrep) {
      return NextResponse.json({ success: false, message: 'Arrepentimiento no encontrado' }, { status: 404 })
    }

    if (arrep.estado !== 'PENDIENTE') {
      return NextResponse.json({ success: false, message: 'Este arrepentimiento ya fue procesado' }, { status: 400 })
    }

    if (estado === 'APROBADO') {
      // Aceptar arrepentimiento - Ley 24.240
      await prisma.$transaction([
        prisma.arrepentimiento.update({
          where: { id },
          data: { estado: 'APROBADO' }
        }),
        prisma.order.update({
          where: { id: arrep.orderId },
          data: {
            status: 'CANCELLED',
            arrepStatus: 'ARREP_OK',
          }
        })
      ])

      // Load order with items for stock restoration
      const order = await prisma.order.findUnique({
        where: { id: arrep.orderId },
        include: {
          items: {
            include: { product: true, accessory: true }
          },
          orderCoupons: { include: { coupon: true } }
        }
      })
      if (!order) {
        return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      }

      const payment = (order.payment || '').toLowerCase()
      const couponTotal = (order.orderCoupons || []).reduce((sum: number, oc: any) => sum + oc.amountUsed, 0)
      const refundTotal = Math.max(0, order.total - couponTotal)
      let refundMethod = ''
      let couponCode = ''
      let refundNote = ''

      try {
        if (payment === 'wallet') {
          const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } })
          if (wallet) {
            await prisma.$transaction([
              prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: refundTotal }, version: { increment: 1 } }
              }),
              prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  type: 'REFUND',
                  amount: refundTotal,
                  balanceBefore: wallet.balance,
                  balanceAfter: wallet.balance + refundTotal,
                  description: `Reembolso orden ${order.code}`,
                }
              })
            ])
            refundMethod = 'wallet'
            refundNote = `Se acreditaron $${refundTotal.toLocaleString('es-AR')} en tu billetera Great Phones.`
          } else {
            refundMethod = 'wallet_no_account'
            refundNote = `No se encontro billetera para el usuario. Tramitar manualmente.`
          }

        } else if (order.mpPaymentId && (payment.includes('mercadopago') || payment.includes('tarjeta') || payment.includes('visa') || payment.includes('master') || payment.includes('credit') || payment.includes('debit') || payment.includes('amex'))) {
          try {
            const idempotency = `refund-${order.code}-${Date.now()}`
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}/refunds`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotency,
              },
            })
            const mpData = await mpRes.json() as any
            if (mpRes.ok && (mpData.status === 'approved' || mpData.status === 'refunded')) {
              refundMethod = 'mercadopago'
              refundNote = `Reembolso procesado automaticamente via MercadoPago por $${refundTotal.toLocaleString('es-AR')}.`
            } else {
              console.error('[ARREP] MP refund failed:', JSON.stringify(mpData))
              refundMethod = 'mp_manual'
              refundNote = `Error al procesar reembolso automatico en MercadoPago. Realizar manualmente. ID: ${order.mpPaymentId}. ${mpData.message || ''}`
            }
          } catch (mpErr: any) {
            console.error('[ARREP] MP refund error:', mpErr)
            refundMethod = 'mp_manual'
            refundNote = `Error al contactar MercadoPago. Realizar reembolso manual. ID: ${order.mpPaymentId}. Error: ${mpErr.message || 'desconocido'}`
          }

        } else if (payment === 'transfer') {
          refundMethod = 'transfer'
          refundNote = `Reembolso por transferencia bancaria pendiente. Monto: $${refundTotal.toLocaleString('es-AR')}.`

        } else if (payment === 'coupons' || refundTotal <= 0) {
          // Fully paid with coupons — no money to refund
          refundMethod = 'coupons'
          refundNote = `La orden fue pagada completamente con cupones. No hay monto monetario a reembolsar.`

        } else {
          // Cash: PagoFacil, RapiPago, efectivo, ticket — create refund coupon
          const expiry = new Date()
          expiry.setFullYear(expiry.getFullYear() + 1)
          couponCode = generateCouponCode('REEM')
          await prisma.coupon.create({
            data: {
              userId: order.userId,
              code: couponCode,
              originalAmount: refundTotal,
              remainingAmount: refundTotal,
              status: 'ACTIVE',
              source: 'refund',
              sourceId: order.code,
              expiresAt: expiry,
            }
          })
          refundMethod = 'coupon'
          refundNote = `Recibis un cupon por $${refundTotal.toLocaleString('es-AR')} valido hasta ${expiry.toLocaleDateString('es-AR')}. Presentalo en tu proxima compra.`
        }

        // Stock restoration — restore stock and release reservations atomically
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: { increment: item.quantity },
                  reserved: { decrement: item.quantity }
                }
              });
            }
            if (item.accessoryId) {
              await tx.accessory.update({
                where: { id: item.accessoryId },
                data: {
                  stock: { increment: item.quantity },
                  reserved: { decrement: item.quantity }
                }
              });
            }
            if (item.inventoryItemId) {
              await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { status: 'IN_STOCK', salePrice: null }
              });
            }
          }
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            refundProcessed: true,
            refundDate: new Date(),
            notes: `Arrepentimiento aceptado segun Ley 24.240 (Res. 424/2020). Reembolso total: $${refundTotal.toLocaleString('es-AR')} via ${refundMethod}. ${refundNote} ${couponCode ? 'Cupon: ' + couponCode : ''}`,
          }
        })

      } catch (refundErr: any) {
        console.error('[ARREP] Refund processing failed:', refundErr)
        refundNote = `ERROR al procesar reembolso automatico: ${refundErr.message || 'desconocido'}. Tramitar manualmente.`
        refundMethod = refundMethod || 'error'

        await prisma.order.update({
          where: { id: order.id },
          data: {
            notes: `Arrepentimiento aceptado. REEMBOLSO FALLIDO. ${refundNote}`
          }
        })
      }

      try {
        await sendArrepAcceptEmail({
          orderCode: arrep.order.code,
          email: arrep.email,
          total: order.total,
          refundMethod,
          couponCode,
          shippingAddress: [order.shippingStreet, order.shippingNumber, order.shippingCity, order.shippingProvince].filter(Boolean).join(', '),
        })
      } catch (emailError) {
        console.error('[ARREP] Error sending accept email:', emailError)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Arrepentimiento aceptado. Se notifico al cliente con instrucciones de devolucion.' 
      })

    } else {
      // Rechazar arrepentimiento
      if (!rejectReason) {
        return NextResponse.json({ success: false, message: 'Motivo de rechazo requerido' }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.arrepentimiento.update({
          where: { id },
          data: { estado: 'RECHAZADO' }
        }),
        prisma.order.update({
          where: { id: arrep.orderId },
          data: {
            arrepStatus: 'ARREP_RECHAZADO',
            arrepReason: rejectReason,
            notes: `Arrepentimiento rechazado - Motivo: ${rejectReason}`,
          }
        })
      ])

      try {
        await sendArrepRejectEmail({
          orderCode: arrep.order.code,
          email: arrep.email,
          reason: rejectReason,
        })
      } catch (emailError) {
        console.error('[ARREP] Error sending reject email:', emailError)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Arrepentimiento rechazado. Se notifico al cliente.' 
      })
    }
  } catch (e) {
    console.error('[ARREP PUT] Error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ success: false, message: 'Error interno: ' + message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(request)
    const body = await request.json()
    
    const { orderId, orden, email, telefono, motivo } = body
    const finalOrderId = orderId || orden
    
    if (!finalOrderId || !email) {
      return NextResponse.json(
        { success: false, message: 'Orden y email requeridos' },
        { status: 400 }
      )
    }

    const orderData = await prisma.order.findFirst({
      where: { code: finalOrderId },
      include: { user: true }
    })

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    const fechaOrden = new Date(orderData.createdAt).getTime()
    const fechaActual = Date.now()
    const diasDiff = Math.floor((fechaActual - fechaOrden) / (1000 * 60 * 60 * 24))

    if (diasDiff > 10) {
      return NextResponse.json(
        { success: false, message: 'El plazo de 10 días hábiles para desistir ha vencido.' },
        { status: 400 }
      )
    }

    if (orderData.user && orderData.user.email !== email) {
      return NextResponse.json(
        { success: false, message: 'El email no coincide con el registrado en la orden' },
        { status: 400 }
      )
    }

    const existingArrep = await prisma.arrepentimiento.findFirst({
      where: { orderId: orderData.id }
    })

    if (existingArrep) {
      return NextResponse.json(
        { success: false, message: 'Ya existe una solicitud de arrepentimiento para esta orden' },
        { status: 400 }
      )
    }

    const registro = await prisma.arrepentimiento.create({
      data: {
        orderId: orderData.id,
        userId: orderData.userId || null,
        email: email,
        telefono: telefono || null,
        motivo: motivo || null,
        estado: 'PENDIENTE'
      }
    })

    await sendArrepentimientoEmail({
      orderCode: orderData.code,
      email: email,
      telefono: telefono,
      motivo: motivo,
      tramite: registro.id
    })

    return NextResponse.json({
      success: true,
      message: 'Tu solicitud ha sido registrada.',
      tramite: registro.id
    })

  } catch (error) {
    console.error('[ARREPENTIMIENTO] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
