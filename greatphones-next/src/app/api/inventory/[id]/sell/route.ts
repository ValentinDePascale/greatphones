import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InventorySellSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { requireAdmin } from '@/lib/auth-guard'



function generateOrderCode() {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const validation = InventorySellSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const data = validation.data

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { product: true }
    })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404, headers: corsHeaders })
    }
    if (item.status === 'SOLD') {
      return NextResponse.json({ error: 'Este dispositivo ya fue vendido' }, { status: 409, headers: corsHeaders })
    }

    // Perform sale in transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()

      // Update inventory item
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          status: 'SOLD',
          salePrice: data.salePrice,
          soldAt: now,
          soldById: body.soldById || null,
        }
      })

      // Decrement product stock if linked
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: 1 },
            sold: { increment: 1 },
          }
        })
      }

      // Create history entry
      await tx.inventoryHistory.create({
        data: {
          inventoryItemId: id,
          type: 'SOLD',
          oldValue: item.status,
          newValue: 'SOLD',
          description: `Vendido a $${data.salePrice.toLocaleString('es-AR')}${data.paymentMethod ? ` — ${data.paymentMethod}` : ''}${data.clientName ? ` — Cliente: ${data.clientName}` : ''}`,
          userId: body.soldById,
        }
      })

      // Create order for record keeping
      if (item.productId) {
        const orderCode = generateOrderCode()
        await tx.order.create({
          data: {
            code: orderCode,
            userId: body.soldById || 'unknown',
            status: 'DELIVERED',
            subtotal: data.salePrice,
            total: data.salePrice,
            payment: data.paymentMethod || 'Efectivo',
            saleChannel: 'in-store',
            adminId: body.soldById,
            clientName: data.clientName,
            clientDni: data.clientDni,
            notes: `Venta local desde inventario — ${item.code} — ${item.brand} ${item.modelName}`,
            items: {
              create: {
                productId: item.productId,
                quantity: 1,
                price: data.salePrice,
              }
            }
          }
        })
      }

      return updated
    })

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error selling inventory item:', error)
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500, headers: corsHeaders })
  }
}
