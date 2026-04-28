import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  OrderCreateSchema, 
  OrderQuerySchema,
  formatZodError 
} from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    // Validar query params
    const queryValidation = OrderQuerySchema.safeParse({ status, userId })
    if (!queryValidation.success) {
      return NextResponse.json(formatZodError(queryValidation.error), { status: 400 })
    }
    
    const where: any = {}
    
    if (status) {
      where.status = status.toUpperCase()
    }
    
    if (userId) {
      where.userId = userId
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar body
    const validation = OrderCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const { items, userId, email, phone, document, street, number, floor, zip, city, province, warranty, cuotas, subtotal, total, notes } = body
    
    // Generate order code
    const code = `GP-${Date.now()}`
    
    // Create order with items - usando nombres del schema
    const order = await prisma.order.create({
      data: {
        code,
        userId: userId || 'guest',
        clientEmail: email || null,
        clientPhone: phone || null,
        clientDni: document || null,
        shippingStreet: street,
        shippingNumber: number,
        shippingFloor: floor || null,
        shippingZip: zip,
        shippingCity: city,
        shippingProvince: province,
        warranty: warranty ? '90 dias' : null,
        cuotas: cuotas || 1,
        subtotal,
        total,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity || 1,
            price: item.price,
          }))
        }
      },
      include: {
        items: true
      }
    })
    
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}