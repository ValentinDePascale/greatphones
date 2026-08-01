import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { releaseStock } from '@/lib/stock'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
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

      await releaseStock(tx, order.items, order.code)

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: 'transfer',
          status: 'approved',
          installments: 1,
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving sale:', error)
    return NextResponse.json({ error: 'Error al aprobar la venta' }, { status: 500 })
  }
}
