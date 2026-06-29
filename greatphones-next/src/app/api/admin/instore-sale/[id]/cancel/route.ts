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
      return NextResponse.json({ error: 'Solo se pueden cancelar órdenes pendientes' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      })

      // For catalog items: restore stock (decrement reserved too)
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              reserved: { decrement: item.quantity },
              sold: { decrement: item.quantity }
            }
          })
        }
      }

      // Find inventory items linked to this order via OrderItem -> InventoryItem
      // Since OrderItem doesn't have a direct inventoryItemId, we look up by code/imei
      // Actually, inventory items that were sold in this order need to be restored
      // We check InventoryHistory for SOLD entries matching this order's code
      const invHistoryEntries = await tx.inventoryHistory.findMany({
        where: {
          type: 'SOLD',
          description: { contains: order.code }
        }
      })

      for (const entry of invHistoryEntries) {
        await tx.inventoryItem.update({
          where: { id: entry.inventoryItemId },
          data: {
            status: 'IN_STOCK',
            salePrice: null,
            soldAt: null,
            soldById: null
          }
        })

        await tx.inventoryHistory.create({
          data: {
            inventoryItemId: entry.inventoryItemId,
            type: 'RETURNED',
            oldValue: 'SOLD',
            newValue: 'IN_STOCK',
            description: `Venta cancelada — devuelto al stock (${order.code})`,
            userId: order.adminId || ''
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling sale:', error)
    var msg = 'Error al cancelar la venta'
    if (error instanceof Error) msg = error.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
