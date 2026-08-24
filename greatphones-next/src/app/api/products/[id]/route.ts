import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'



export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    })
    if (!product || product.deletedAt) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product, {
      headers: {  }
    })
  } catch (error) { return handleRouteError(error) }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireAdmin(request)
    const body = await request.json()
    console.log('Updating product:', id)
    console.log('Body:', JSON.stringify(body))
    
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.brand !== undefined) updateData.brand = body.brand
    if (body.sub !== undefined) updateData.sub = body.sub || null
    if (body.price !== undefined) updateData.price = Number(body.price)
    if (body.stock !== undefined) updateData.stock = Number(body.stock)
    if (body.condition !== undefined) updateData.condition = body.condition
    if (body.type !== undefined) updateData.type = body.type
    if (body.color !== undefined) updateData.color = body.color || null
    if (body.screen !== undefined) updateData.screen = body.screen ? Number(body.screen) : null
    if (body.storage !== undefined) updateData.storage = body.storage || null
    if (body.ram !== undefined) updateData.ram = body.ram || null
    if (body.battery !== undefined) updateData.battery = body.battery ? Number(body.battery) : null
    if (body.processor !== undefined) updateData.processor = body.processor || null
    if (body.discount !== undefined) updateData.discount = Number(body.discount)
    if (body.isOffer !== undefined) updateData.isOffer = Boolean(body.isOffer)
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null
    if (body.images !== undefined) updateData.images = body.images || []
    if (body.ico !== undefined) updateData.ico = body.ico
    if (body.offerStart !== undefined) {
      updateData.offerStart = body.offerStart ? new Date(body.offerStart) : null
    }
    if (body.offerEnd !== undefined) {
      updateData.offerEnd = body.offerEnd ? new Date(body.offerEnd) : null
    }

    console.log('Update data:', JSON.stringify(updateData))
    
    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    })
    console.log('Updated product:', updated)
    return NextResponse.json(updated, {
      headers: {  }
    })
  } catch (error) { return handleRouteError(error) }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireAdmin(request)
    // Unlink all inventory items before deleting the product
    await prisma.inventoryItem.updateMany({
      where: { productId: id },
      data: { productId: null }
    })
    await prisma.product.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Product deleted' }, {
      headers: {  }
    })
  } catch (error) { return handleRouteError(error) }
}
