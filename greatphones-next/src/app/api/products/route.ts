import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    return NextResponse.json(products, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
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
        images: body.images || [],
        color: body.color || null,
        screen: body.screen ? Number(body.screen) : null,
        discount: Number(body.discount) || 0,
        isOffer: Boolean(body.isOffer),
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
