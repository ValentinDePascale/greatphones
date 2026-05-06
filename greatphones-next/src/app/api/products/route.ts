import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  ProductCreateSchema, 
  ProductUpdateSchema,
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
  const brand = searchParams.get('brand')
  const offer = searchParams.get('offer')
  const search = searchParams.get('search')
   
  try {
    const where: any = {}
    
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' }
    }
    
    if (offer === 'true') {
      where.isOffer = true
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar body
    const validation = ProductCreateSchema.safeParse(body)
    if (!validation.success) {
      console.error('Product validation failed:', JSON.stringify(validation.error.issues, null, 2))
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    console.log('Creating product with data:', body)
    
    const newProduct = await prisma.product.create({
      data: {
        name: body.name,
        ico: body.ico || '📱',
        imageUrl: body.imageUrl || null,
        brand: body.brand,
        sub: body.sub,
        condition: body.condition || 'Nuevo',
        price: Number(body.price) || 0,
        cost: Number(body.cost) || 0,
        stock: Number(body.stock) || 0,
        type: body.type || 'celular',
        storage: body.storage || null,
        ram: body.ram || null,
        battery: body.battery ? Number(body.battery) : null,
        processor: body.processor || null,
        images: body.images || [],
        color: body.color || null,
        screen: body.screen ? Number(body.screen) : null,
        isOffer: Boolean(body.isOffer),
        discount: Number(body.discount) || 0,
        offerStart: body.offerStart ? new Date(body.offerStart) : null,
        offerEnd: body.offerEnd ? new Date(body.offerEnd) : null,
      },
    })
    
    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
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
    const validation = ProductUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.ico && { ico: body.ico }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.brand && { brand: body.brand }),
        ...(body.sub && { sub: body.sub }),
        ...(body.condition && { condition: body.condition }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.cost !== undefined && { cost: Number(body.cost) }),
        ...(body.stock !== undefined && { stock: Number(body.stock) }),
        ...(body.type && { type: body.type }),
        ...(body.storage !== undefined && { storage: body.storage || null }),
        ...(body.ram !== undefined && { ram: body.ram || null }),
        ...(body.battery !== undefined && { battery: body.battery ? Number(body.battery) : null }),
        ...(body.processor !== undefined && { processor: body.processor || null }),
        ...(body.images && { images: body.images }),
        ...(body.color !== undefined && { color: body.color || null }),
        ...(body.screen !== undefined && { screen: body.screen ? Number(body.screen) : null }),
        ...(body.isOffer !== undefined && { isOffer: Boolean(body.isOffer) }),
        ...(body.discount !== undefined && { discount: Number(body.discount) }),
        ...(body.offerStart && { offerStart: new Date(body.offerStart) }),
        ...(body.offerEnd && { offerEnd: new Date(body.offerEnd) }),
      },
    })
    
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.favorite.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product', details: (error as Error).message }, { status: 500 })
  }
}