/**
 * Atomic stock operations for products, accessories, and inventory items.
 * All functions expect a Prisma transaction client (tx).
 */

interface StockItem {
  productId?: string | null
  accessoryId?: string | null
  inventoryItemId?: string | null
  quantity: number
}

export async function reserveStock(tx: any, items: StockItem[]) {
  for (const item of items) {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          reserved: { increment: item.quantity },
        },
      })
    }
    if (item.accessoryId) {
      await tx.accessory.update({
        where: { id: item.accessoryId },
        data: {
          stock: { decrement: item.quantity },
          reserved: { increment: item.quantity },
        },
      })
    }
  }
}

export async function releaseStock(tx: any, items: StockItem[], orderCode?: string) {
  for (const item of items) {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          reserved: { decrement: item.quantity },
          sold: { increment: item.quantity },
        },
      })
    }
    if (item.accessoryId) {
      await tx.accessory.update({
        where: { id: item.accessoryId },
        data: {
          reserved: { decrement: item.quantity },
          sold: { increment: item.quantity },
        },
      })
    }
    if (item.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { status: 'SOLD' as const, soldAt: new Date() },
      })
      await tx.inventoryHistory.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          type: 'SOLD',
          oldValue: 'RESERVED',
          newValue: 'SOLD',
          description: orderCode ? `Venta confirmada — pago aprobado (order: ${orderCode})` : 'Venta confirmada',
          userId: '',
        },
      })
    }
  }
}

export async function restoreStock(tx: any, items: StockItem[], wasProcessing: boolean, orderCode?: string) {
  for (const item of items) {
    if (item.productId) {
      const data: any = {
        stock: { increment: item.quantity },
        reserved: { decrement: item.quantity },
      }
      if (wasProcessing) {
        data.sold = { decrement: item.quantity }
      }
      await tx.product.update({ where: { id: item.productId }, data })
    }
    if (item.accessoryId) {
      await tx.accessory.update({
        where: { id: item.accessoryId },
        data: {
          stock: { increment: item.quantity },
          reserved: { decrement: item.quantity },
        },
      })
    }
    if (item.inventoryItemId) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { status: 'IN_STOCK' as const, salePrice: null },
      })
      await tx.inventoryHistory.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          type: 'STATUS_CHANGE',
          oldValue: 'RESERVED',
          newValue: 'IN_STOCK',
          description: orderCode ? `Reserva liberada — pago rechazado/cancelado (order: ${orderCode})` : 'Reserva liberada',
          userId: '',
        },
      })
    }
  }
}
