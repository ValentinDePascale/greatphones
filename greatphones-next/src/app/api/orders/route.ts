import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  OrderCreateSchema, 
  OrderQuerySchema,
  formatZodError 
} from '@/lib/validations'
import { sendOrderStatusEmail } from '@/lib/email'
import { requireAdmin, requireSession } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const admin = searchParams.get('admin')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    let authUser: { id: string; role: string } | null = null
    try { authUser = await requireSession(request) } catch {}
    
    if (admin === 'true') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    } else if (userId) {
      if (!authUser || (authUser.id !== userId && authUser.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else {
      if (!authUser || authUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    const user = authUser
    
    const status = searchParams.get('status') || undefined
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
    
    if (search && admin === 'true') {
      where.OR = [
        { clientDni: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const total = await prisma.order.count({ where })
    
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
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  brand: true,
                  sub: true,
                }
              }
            }
          },
          orderCoupons: {
            include: {
              coupon: {
                select: {
                  code: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
      
      return NextResponse.json({
        data: transformed,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                brand: true,
                sub: true,
              }
            }
          }
        },
        orderCoupons: {
          include: {
            coupon: {
              select: {
                code: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    return NextResponse.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
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
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { status, trackingNumber } = body
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    const order = await prisma.order.findUnique({
      where: { id },
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
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    const oldStatus = order.status
    const updateData: any = { status: status.toUpperCase() }
    
    if (status.toUpperCase() === 'SHIPPED' && trackingNumber) {
      updateData.trackingNumber = trackingNumber
      updateData.shippedAt = new Date()
    }

    // Restore stock if cancelling a PENDING or PROCESSING order
    if (status.toUpperCase() === 'CANCELLED' && (oldStatus === 'PENDING' || oldStatus === 'PROCESSING')) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                reserved: { decrement: item.quantity },
              },
            });
          }
          if (item.accessoryId) {
            await tx.accessory.update({
              where: { id: item.accessoryId },
              data: {
                stock: { increment: item.quantity },
                reserved: { decrement: item.quantity },
              },
            });
          }
        }
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
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
    
    // Send email notification if status changed
    if (oldStatus !== status.toUpperCase()) {
      sendOrderStatusEmail({
        email: order.clientEmail || order.user?.email || '',
        userName: order.user?.name || 'Cliente',
        orderCode: order.code,
        oldStatus,
        newStatus: status.toUpperCase(),
        trackingNumber: trackingNumber || updatedOrder.trackingNumber || undefined,
      }).catch((err) => console.error('[Orders] Error sending status email:', err))
    }
    
    const transformed = {
      ...updatedOrder,
      items: updatedOrder.items.map(item => ({
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
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Release reserved stock before deleting
    if (order.status === 'PENDING' || order.status === 'PROCESSING') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                reserved: { decrement: item.quantity },
              },
            });
          }
          if (item.accessoryId) {
            await tx.accessory.update({
              where: { id: item.accessoryId },
              data: {
                stock: { increment: item.quantity },
                reserved: { decrement: item.quantity },
              },
            });
          }
        }
      });
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