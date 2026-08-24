import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'

function generatePreOrderCode() {
  const prefix = 'PRE'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const source = searchParams.get('source')

    const where: any = {}
    if (status) where.status = status
    if (source) where.source = source
    if (search) {
      const s = search.trim()
      where.OR = [
        { clientName: { contains: s, mode: 'insensitive' } },
        { clientDni: { contains: s } },
        { productModelName: { contains: s, mode: 'insensitive' } },
      ]
    }

    const preOrders = await prisma.preOrder.findMany({
      where,
      include: { product: { select: { id: true, name: true, imageUrl: true, ico: true, price: true, cost: true, stock: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(preOrders)
  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json({ error: 'Error al obtener preventas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const {
      clientName, clientDni, clientPhone, clientEmail,
      productModelName, productStorage, productColor, productCondition,
      price, paymentMethod, paymentType, installments,
      expectedDeliveryStart, expectedDeliveryEnd,
      notes,
    } = body

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 })
    }

    if (!productModelName) {
      return NextResponse.json({ error: 'Seleccioná un modelo de iPhone' }, { status: 400 })
    }

    const preOrder = await prisma.preOrder.create({
      data: {
        code: generatePreOrderCode(),
        clientName: clientName.trim(),
        clientDni: clientDni || null,
        clientPhone: clientPhone || null,
        clientEmail: clientEmail || null,
        productModelName: productModelName || null,
        productStorage: productStorage || null,
        productColor: productColor || null,
        productCondition: productCondition || null,
        price: price ? Number(price) : 0,
        paymentMethod: paymentMethod || null,
        paymentType: paymentType || null,
        installments: installments ? Number(installments) : null,
        expectedDeliveryStart: expectedDeliveryStart ? new Date(expectedDeliveryStart) : null,
        expectedDeliveryEnd: expectedDeliveryEnd ? new Date(expectedDeliveryEnd) : null,
        notes: notes || null,
        createdById: admin.id,
      },
    })

    // Núcleo contable: cobro anticipado de la preventa → asiento INGRESO
    const amt = price ? Number(price) : 0
    if (amt > 0) {
      const means = paymentMethod === 'cash' ? 'EFECTIVO' : paymentMethod === 'transfer' ? 'TRANSFERENCIA' : paymentType === 'card' ? 'CUOTAS' : 'TRANSFERENCIA'
      try {
        await registerEntry({
          source: 'PREORDER',
          operationId: preOrder.code,
          description: `Preventa ${preOrder.code} — ${clientName} — ${productModelName || ''}`,
          category: 'Preventas',
          type: 'INGRESO',
          means,
          amount: amt,
          createdById: admin.id,
        })
      } catch (e) { console.error('[Preorders] asiento:', e) }
    }

    return NextResponse.json(preOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating preorder:', error)
    return NextResponse.json({ error: 'Error al crear preventa' }, { status: 500 })
  }
}
