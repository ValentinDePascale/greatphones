import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InventoryUpdateSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    const { id } = await params
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, price: true, stock: true } },
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        soldBy: { select: { id: true, name: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        }
      }
    })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404, headers: corsHeaders })
    }
    return NextResponse.json(item, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: 'Error al obtener item' }, { status: 500, headers: corsHeaders })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const validation = InventoryUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const data = validation.data
    const oldItem = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!oldItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404, headers: corsHeaders })
    }

    const changes: string[] = []
    const updateData: any = {}

    if (data.notes !== undefined && data.notes !== oldItem.notes) {
      changes.push(`Observaciones: "${oldItem.notes || '—'}" → "${data.notes}"`)
      updateData.notes = data.notes
    }
    if (data.cosmeticCondition !== undefined && data.cosmeticCondition !== oldItem.cosmeticCondition) {
      changes.push(`Estado estético: ${oldItem.cosmeticCondition} → ${data.cosmeticCondition}`)
      updateData.cosmeticCondition = data.cosmeticCondition
    }
    if (data.batteryHealth !== undefined && data.batteryHealth !== oldItem.batteryHealth) {
      changes.push(`Batería: ${oldItem.batteryHealth ?? '—'}% → ${data.batteryHealth}%`)
      updateData.batteryHealth = data.batteryHealth
    }
    if (data.targetPrice !== undefined && data.targetPrice !== oldItem.targetPrice) {
      changes.push(`Precio target: ${oldItem.targetPrice} → ${data.targetPrice}`)
      updateData.targetPrice = data.targetPrice
    }
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice
    if (data.investor !== undefined) updateData.investor = data.investor
    if (data.functionalCondition !== undefined) updateData.functionalCondition = data.functionalCondition
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber
    if (data.storage !== undefined) updateData.storage = data.storage
    if (data.color !== undefined) updateData.color = data.color
    if (data.modelNumber !== undefined) updateData.modelNumber = data.modelNumber
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId
    if (data.purchasedFrom !== undefined) updateData.purchasedFrom = data.purchasedFrom

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    })

    if (changes.length > 0) {
      await prisma.inventoryHistory.create({
        data: {
          inventoryItemId: id,
          type: 'NOTE',
          description: changes.join('; '),
          userId: body.updatedById,
        }
      })
    }

    return NextResponse.json(updated, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500, headers: corsHeaders })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { id } = await params
    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404, headers: corsHeaders })
    }

    // Restore product stock if linked
    if (item.productId && item.status === 'IN_STOCK') {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: 1 } }
      })
    }

    await prisma.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500, headers: corsHeaders })
  }
}
