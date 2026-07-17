import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

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

    const where: any = {}
    if (status) where.status = status

    const preOrders = await prisma.preOrder.findMany({
      where,
      include: { product: { select: { id: true, name: true, imageUrl: true, ico: true, price: true, cost: true, stock: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(preOrders)
  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json({ error: 'Error al obtener preeventas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { clientName, clientDni, clientPhone, clientEmail, productId, customName, customPrice, notes } = body

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 })
    }

    if (!productId && !customName) {
      return NextResponse.json({ error: 'Seleccioná un producto del catálogo o ingresá un nombre de producto' }, { status: 400 })
    }

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
      if (!product) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }
    }

    const preOrder = await prisma.preOrder.create({
      data: {
        code: generatePreOrderCode(),
        clientName: clientName.trim(),
        clientDni: clientDni || null,
        clientPhone: clientPhone || null,
        clientEmail: clientEmail || null,
        productId: productId || null,
        customName: customName || null,
        customPrice: customPrice ? Number(customPrice) : null,
        notes: notes || null,
        createdById: admin.id,
      },
      include: { product: { select: { id: true, name: true, imageUrl: true, ico: true, price: true } } },
    })

    return NextResponse.json(preOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating preorder:', error)
    return NextResponse.json({ error: 'Error al crear preeventa' }, { status: 500 })
  }
}
