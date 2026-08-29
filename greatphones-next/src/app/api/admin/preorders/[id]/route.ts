import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED']

const INCLUDE_DEFAULT = {
  product: { select: { id: true, name: true, imageUrl: true, ico: true, price: true, cost: true, stock: true } },
}

function generateOrderCode() {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const preOrder = await prisma.preOrder.findUnique({
      where: { id },
      include: INCLUDE_DEFAULT,
    })
    if (!preOrder) {
      return NextResponse.json({ error: 'Preventa no encontrada' }, { status: 404 })
    }
    return NextResponse.json(preOrder)
  } catch (error) {
    console.error('Error fetching preorder:', error)
    return NextResponse.json({ error: 'Error al obtener preventa' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { status, clientName, clientDni, clientPhone, productModelName, price, expectedDeliveryStart, expectedDeliveryEnd, notes } = body

    const existing = await prisma.preOrder.findUnique({ where: { id }, select: { id: true, status: true, price: true, clientName: true, clientDni: true, clientPhone: true, clientEmail: true, productModelName: true, productStorage: true, productColor: true, paymentMethod: true, paymentType: true, installments: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Preventa no encontrada' }, { status: 404 })
    }

    // If changing status to DELIVERED, create an Order first
    if (status === 'DELIVERED' && existing.status !== 'DELIVERED') {
      const result = await prisma.$transaction(async (tx) => {
        // Find or create a generic user for walk-in pre-sale customers
        let userId = admin.id
        if (existing.clientDni) {
          const foundUser = await tx.user.findFirst({ where: { dni: existing.clientDni }, select: { id: true } })
          if (foundUser) userId = foundUser.id
        }

        const orderCode = generateOrderCode()
        const totalAmount = price || existing.price || 0

        const order = await tx.order.create({
          data: {
            code: orderCode,
            userId,
            status: 'DELIVERED',
            subtotal: totalAmount,
            total: totalAmount,
            payment: existing.paymentMethod === 'cash' ? 'Efectivo' : existing.paymentMethod === 'transfer' ? 'Transferencia' : null,
            cuotas: existing.installments || 1,
            saleChannel: 'preorder',
            clientName: clientName || existing.clientName,
            clientDni: clientDni || existing.clientDni,
            clientPhone: clientPhone || existing.clientPhone,
            clientEmail: existing.clientEmail,
            adminId: admin.id,
            items: {
              create: {
                customName: [productModelName || existing.productModelName, existing.productStorage, existing.productColor].filter(Boolean).join(' · ') || 'Producto en preventa',
                price: totalAmount,
                quantity: 1,
              },
            },
          },
          include: { items: true },
        })

        const updateData: any = { status: 'DELIVERED', deliveredAt: new Date() }
        if (clientName !== undefined) updateData.clientName = clientName
        if (clientDni !== undefined) updateData.clientDni = clientDni
        if (clientPhone !== undefined) updateData.clientPhone = clientPhone
        if (productModelName !== undefined) updateData.productModelName = productModelName
        if (price !== undefined) updateData.price = price
        if (expectedDeliveryStart !== undefined) updateData.expectedDeliveryStart = expectedDeliveryStart ? new Date(expectedDeliveryStart) : null
        if (expectedDeliveryEnd !== undefined) updateData.expectedDeliveryEnd = expectedDeliveryEnd ? new Date(expectedDeliveryEnd) : null
        if (notes !== undefined) updateData.notes = notes

        const updated = await tx.preOrder.update({
          where: { id },
          data: updateData,
          include: INCLUDE_DEFAULT,
        })

        return { order, preOrder: updated }
      })

      return NextResponse.json({ success: true, order: result.order, preOrder: result.preOrder })
    }

    // Handle regular field updates (edit mode)
    const updateData: any = {}
    if (status && VALID_STATUSES.includes(status)) updateData.status = status
    if (clientName !== undefined) updateData.clientName = clientName
    if (clientDni !== undefined) updateData.clientDni = clientDni
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone
    if (productModelName !== undefined) updateData.productModelName = productModelName
    if (price !== undefined) updateData.price = price
    if (expectedDeliveryStart !== undefined) updateData.expectedDeliveryStart = expectedDeliveryStart ? new Date(expectedDeliveryStart) : null
    if (expectedDeliveryEnd !== undefined) updateData.expectedDeliveryEnd = expectedDeliveryEnd ? new Date(expectedDeliveryEnd) : null
    if (notes !== undefined) updateData.notes = notes

    const updated = await prisma.preOrder.update({
      where: { id },
      data: updateData,
      include: INCLUDE_DEFAULT,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating preorder:', error)
    return NextResponse.json({ error: 'Error al actualizar preventa' }, { status: 500 })
  }
}
