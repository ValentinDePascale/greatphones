import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden aprobar órdenes pendientes' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' }
      })

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving sale:', error)
    var msg = 'Error al aprobar la venta'
    if (error instanceof Error) msg = error.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
