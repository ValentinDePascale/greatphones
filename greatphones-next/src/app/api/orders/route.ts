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
    const status = searchParams.get('status') || undefined
    const userId = searchParams.get('userId') || undefined
    const admin = searchParams.get('admin')
    
    const where: any = {}
    
    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      const statusList = status.split(',').map(s => s.trim().toUpperCase())
      
      for (const s of statusList) {
        if (!validStatuses.includes(s)) {
          return NextResponse.json({ error: `Invalid status: ${s}` }, { status: 400 })
        }
      }
      
      if (statusList.length === 1) {
        where.status = statusList[0]
      } else {
        where.status = { in: statusList }
      }
    }
    
    if (userId) {
      where.userId = userId
    }
    
    // Admin view: include user and product details
    if (admin === 'true') {
      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
      
      // Transform to include product details in items
      const transformed = orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          productName: item.product?.name || 'Producto eliminado',
          productImage: item.product?.imageUrl || null,
          productBrand: item.product?.brand || '',
          productSub: item.product?.sub || '',
        }))
      }))
      
      return NextResponse.json(transformed)
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
    
    // Find or create user
    let finalUserId = userId
    if (!finalUserId && email) {
      const existingUser = await prisma.user.findFirst({
        where: { email }
      })
      if (existingUser) {
        finalUserId = existingUser.id
      } else {
        const newUser = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            phone: phone || null,
          }
        })
        finalUserId = newUser.id
      }
    }
    
    if (!finalUserId) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 })
    }
    
    // Generate order code
    const code = `GP-${Date.now()}`
    
    // Create order with items - usando nombres del schema
    const order = await prisma.order.create({
      data: {
        code,
        userId: finalUserId,
        clientEmail: email || null,
        clientPhone: phone || null,
        clientDni: document || null,
        shippingStreet: street,
        shippingNumber: number,
        shippingFloor: floor || null,
        shippingZip: zip,
        shippingCity: city,
        shippingProvince: province,
        ...(warranty && { warranty: '90 dias' }),
        cuotas: cuotas || 1,
        subtotal,
        total,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { status } = body
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    const transformed = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        productName: item.product?.name || 'Producto eliminado',
        productImage: item.product?.imageUrl || null,
        productBrand: item.product?.brand || '',
        productSub: item.product?.sub || '',
      }))
    }
    
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    
    await prisma.order.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}