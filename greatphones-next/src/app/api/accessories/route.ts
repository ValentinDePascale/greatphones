import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  AccessoryCreateSchema, 
  AccessoryUpdateSchema,
  formatZodError 
} from '@/lib/validations'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')
  const search = searchParams.get('search')
   
  try {
    const where: any = { isActive: true }
    
    if (category && category !== 'todos') {
      where.category = category
    }
    
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const accessories = await prisma.accessory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(accessories)
  } catch (error) {
    console.error('Error fetching accessories:', error)
    return NextResponse.json({ error: 'Failed to fetch accessories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar body
    const validation = AccessoryCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    console.log('Creating accessory with data:', body)
    
    const newAccessory = await prisma.accessory.create({
      data: {
        name: body.name,
        ico: body.ico || '📦',
        description: body.description || null,
        category: body.category,
        price: Number(body.price) || 0,
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
        stock: Number(body.stock) || 0,
        imageUrl: body.imageUrl || null,
        images: body.images || [],
        brand: body.brand || null,
        color: body.color || null,
        compatibleModels: body.compatibleModels || null,
        isActive: body.isActive !== false,
        discount: body.discount ? Number(body.discount) : null,
        isOffer: body.isOffer || false,
        offerStart: body.offerStart ? new Date(body.offerStart) : null,
        offerEnd: body.offerEnd ? new Date(body.offerEnd) : null,
      },
    })
    
    return NextResponse.json(newAccessory, { status: 201 })
  } catch (error) {
    console.error('Error creating accessory:', error)
    return NextResponse.json({ error: 'Failed to create accessory' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    const body = await request.json()
    
    // Validar body (partial para updates)
    const validation = AccessoryUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const updatedAccessory = await prisma.accessory.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.ico && { ico: body.ico }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.category && { category: body.category }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.compareAtPrice !== undefined && { compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null }),
        ...(body.stock !== undefined && { stock: Number(body.stock) }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.images && { images: body.images }),
        ...(body.brand !== undefined && { brand: body.brand || null }),
        ...(body.color !== undefined && { color: body.color || null }),
        ...(body.compatibleModels !== undefined && { compatibleModels: body.compatibleModels || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.discount !== undefined && { discount: body.discount !== null ? Number(body.discount) : null }),
        ...(body.isOffer !== undefined && { isOffer: body.isOffer }),
        ...(body.offerStart !== undefined && { offerStart: body.offerStart ? new Date(body.offerStart) : null }),
        ...(body.offerEnd !== undefined && { offerEnd: body.offerEnd ? new Date(body.offerEnd) : null }),
      },
    })
    
    return NextResponse.json(updatedAccessory)
  } catch (error) {
    console.error('Error updating accessory:', error)
    return NextResponse.json({ error: 'Failed to update accessory' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    await prisma.accessory.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting accessory:', error)
    return NextResponse.json({ error: 'Failed to delete accessory' }, { status: 500 })
  }
}