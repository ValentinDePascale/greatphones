import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InventoryStatusSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { productCache } from '@/lib/cache'



export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const validation = InventoryStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const { status, notes } = validation.data

    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404, headers: corsHeaders })
    }

    if (item.status === status) {
      return NextResponse.json({ error: 'El dispositivo ya tiene este estado' }, { status: 409, headers: corsHeaders })
    }

    const oldStatus = item.status

    const updated = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { status },
        include: { preOrder: { select: { id: true } } },
      })

      // Sincronizar stock del producto si existe
      if (updatedItem.productId) {
        let newStock = 0
        if (status === 'IN_STOCK') {
          // Si tiene preventa vinculada, no suma stock (se reserva)
          newStock = updatedItem.preOrder ? 0 : 1
        } else if (status === 'IN_REPAIR' || status === 'RESERVED' || status === 'ON_HOLD' || status === 'SOLD') {
          newStock = 0
        }

        await tx.product.update({
          where: { id: updatedItem.productId },
          data: { stock: newStock },
        })
      }

      let description = `Estado cambiado: ${getStatusLabel(oldStatus)} → ${getStatusLabel(status)}`
      if (notes) description += ` — ${notes}`

      await tx.inventoryHistory.create({
        data: {
          inventoryItemId: id,
          type: 'STATUS_CHANGE',
          oldValue: oldStatus,
          newValue: status,
          description,
          userId: body.userId,
        }
      })

      return updatedItem
    })

    // Limpiar cache de productos
    if (item.productId) {
      productCache.clear()
    }

    return NextResponse.json(updated, { headers: corsHeaders })
  } catch (error) { return handleRouteError(error) }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_STOCK: 'En stock',
    IN_REPAIR: 'En reparación',
    RESERVED: 'Reservado',
    ON_HOLD: 'En espera',
    SOLD: 'Vendido',
  }
  return labels[status] || status
}
