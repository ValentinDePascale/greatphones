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
  const id = searchParams.get('id')
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')
  const search = searchParams.get('search')
   
  try {
    if (id) {
      const accessory = await prisma.accessory.findUnique({ where: { id } })
      if (!accessory) {
        return NextResponse.json({ error: 'Accesorio no encontrado' }, { status: 404 })
      }
      return NextResponse.json(accessory)
    }
    
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
    console.log('PUT accessory body:', JSON.stringify(body, null, 2))
    
    // Validar body (partial para updates)
    const validation = AccessoryUpdateSchema.safeParse(body)
    if (!validation.success) {
      console.error('Zod validation failed:', JSON.stringify(validation.error.issues || validation.error.errors, null, 2))
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const data: any = {}
    if (body.name) data.name = body.name
    if (body.ico) data.ico = body.ico
    if (body.description !== undefined) data.description = body.description || null
    if (body.category) data.category = body.category
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.compareAtPrice !== undefined) data.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null
    if (body.stock !== undefined) data.stock = Number(body.stock)
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
    if (body.images !== undefined) data.images = Array.isArray(body.images) ? body.images : []
    if (body.brand !== undefined) data.brand = body.brand || null
    if (body.color !== undefined) data.color = body.color || null
    if (body.compatibleModels !== undefined) data.compatibleModels = body.compatibleModels || null
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.discount !== undefined) data.discount = body.discount !== null ? Number(body.discount) : null
    if (body.isOffer !== undefined) data.isOffer = body.isOffer
    if (body.offerStart !== undefined) data.offerStart = body.offerStart ? new Date(body.offerStart) : null
    if (body.offerEnd !== undefined) data.offerEnd = body.offerEnd ? new Date(body.offerEnd) : null
    
    console.log('Prisma update data:', JSON.stringify(data, null, 2))
    
    const updatedAccessory = await prisma.accessory.update({
      where: { id },
      data,
    })
    
    return NextResponse.json(updatedAccessory)
  } catch (error: any) {
    console.error('Error updating accessory:', error)
    console.error('Error code:', error?.code)
    console.error('Error meta:', error?.meta)
    return NextResponse.json({ error: 'Failed to update accessory', details: error?.message }, { status: 500 })
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