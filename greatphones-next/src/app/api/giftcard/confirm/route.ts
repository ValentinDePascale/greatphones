import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    const user = await requireSession(request)
    const { searchParams } = new URL(request.url)
    const gcId = searchParams.get('gcId')

    if (!gcId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const giftCard = await prisma.giftCard.findUnique({ where: { id: gcId } })
    if (!giftCard) {
      return NextResponse.json({ error: 'Gift Card no encontrada' }, { status: 404 })
    }

    if (giftCard.buyerEmail !== user.email && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (giftCard.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'La Gift Card aún no fue pagada' }, { status: 400 })
    }

    return NextResponse.json({
      code: giftCard.code,
      amount: giftCard.originalAmount,
      status: giftCard.status,
    })
  } catch (error) {
    console.error('[GiftCard Confirm] Error:', error)
    return NextResponse.json({ error: 'Error al obtener Gift Card' }, { status: 500 })
  }
}
