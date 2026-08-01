import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'



export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const limit = await rateLimit(`order-track:${ip}`, 15, 60000)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera 1 minuto.' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const email = searchParams.get('email')

    if (!code || !email) {
      return NextResponse.json({ error: 'Codigo de orden y email requeridos' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        code: code,
        clientEmail: email,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true, ico: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const statusLabels: Record<string, string> = {
      PENDING: 'Pedido recibido',
      PROCESSING: 'Preparando tu pedido',
      SHIPPED: 'En camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    }

    const statusSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const currentIndex = statusSteps.indexOf(order.status)

    return NextResponse.json({
      id: order.id,
      code: order.code,
      status: order.status,
      statusLabel: statusLabels[order.status] || order.status,
      currentStep: currentIndex >= 0 ? currentIndex : 0,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      shippingAddress: [order.shippingStreet, order.shippingNumber, order.shippingFloor, order.shippingCity, order.shippingProvince, order.shippingZip].filter(Boolean).join(', '),
      trackingNumber: order.trackingNumber || null,
      trackingUrl: order.trackingUrl || null,
      carrier: order.carrier || null,
      carrierService: order.carrierService || null,
      items: order.items.map(item => ({
        name: item.product?.name || 'Producto',
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.product?.imageUrl,
        ico: item.product?.ico,
      })),
    })
  } catch (error) {
    console.error('Track order error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
