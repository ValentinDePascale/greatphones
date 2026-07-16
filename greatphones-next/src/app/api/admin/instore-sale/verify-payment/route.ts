import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { requireAdmin } from '@/lib/auth-guard'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { orderId, mpPaymentId } = body

    if (!orderId || !mpPaymentId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Consultar estado del pago en MercadoPago
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: mpPaymentId })

    const status = paymentData.status

    if (status === 'approved') {
      // Buscar orden
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!order) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      // Actualizar orden y stock en transacción
      await prisma.$transaction(async (tx) => {
        // Actualizar orden
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'DELIVERED',
            mpStatus: 'approved'
          }
        })

        // Convertir reserved a sold
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reserved: { decrement: item.quantity },
                sold: { increment: item.quantity }
              }
            })
          }
        }
      })

      return NextResponse.json({
        paid: true,
        status: 'approved',
        order
      })
    }

    // Pago pendiente o rechazado
    return NextResponse.json({
      paid: false,
      status
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Error al verificar el pago' }, { status: 500 })
  }
}
