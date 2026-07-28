import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const user = await requireSession(request)
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()
    if (!/^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Formato de código inválido (GP-XXXX-XXXX)' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rl = await rateLimit(`redeem:${ip}`, 5, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá un minuto.' }, { status: 429 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const giftCardRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "GiftCard" WHERE code = $1 FOR UPDATE',
        normalizedCode
      )

      if (!giftCardRows || giftCardRows.length === 0) {
        throw { status: 404, message: 'Código no encontrado' }
      }

      const gc = await tx.giftCard.findUnique({ where: { id: giftCardRows[0].id } })
      if (!gc) {
        throw { status: 404, message: 'Código no encontrado' }
      }

      if (gc.status !== 'ACTIVE') {
        if (gc.status === 'REDEEMED') throw { status: 400, message: 'Esta Gift Card ya fue canjeada' }
        if (gc.status === 'EXPIRED') throw { status: 400, message: 'Esta Gift Card expiró' }
        throw { status: 400, message: 'Gift Card no disponible' }
      }

      if (gc.expiresAt && gc.expiresAt < new Date()) {
        await tx.giftCard.update({
          where: { id: gc.id },
          data: { status: 'EXPIRED' }
        })
        throw { status: 400, message: 'Esta Gift Card expiró' }
      }

      // Create coupon from gift card
      const couponCode = gc.code
      const expiresAt = gc.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

      const existing = await tx.coupon.findUnique({ where: { code: couponCode } })
      if (existing) {
        throw { status: 400, message: 'Esta Gift Card ya fue canjeada' }
      }

      const coupon = await tx.coupon.create({
        data: {
          userId: user.id,
          code: couponCode,
          originalAmount: gc.originalAmount,
          remainingAmount: gc.originalAmount,
          source: 'giftcard',
          sourceId: gc.id,
          expiresAt,
        }
      })

      await tx.giftCard.update({
        where: { id: gc.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedByUserId: user.id,
        }
      })

      return { amount: gc.originalAmount, code: coupon.code, couponId: coupon.id }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[GiftCard Redeem] Error:', error)
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Error al canjear la Gift Card' }, { status: 500 })
  }
}
