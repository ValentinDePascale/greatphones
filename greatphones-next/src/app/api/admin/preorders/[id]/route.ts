import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SOLD', 'CANCELLED']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido. Valores: ' + VALID_STATUSES.join(', ') }, { status: 400 })
    }

    const existing = await prisma.preOrder.findUnique({ where: { id }, select: { id: true, status: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Preeventa no encontrada' }, { status: 404 })
    }

    const updated = await prisma.preOrder.update({
      where: { id },
      data: { status },
      include: { product: { select: { id: true, name: true, imageUrl: true, ico: true, price: true, cost: true, stock: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating preorder:', error)
    return NextResponse.json({ error: 'Error al actualizar preeventa' }, { status: 500 })
  }
}
