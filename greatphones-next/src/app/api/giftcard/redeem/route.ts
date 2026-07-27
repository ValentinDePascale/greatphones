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
      const giftCard = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "GiftCard" WHERE code = $1 FOR UPDATE',
        normalizedCode
      )

      if (!giftCard || giftCard.length === 0) {
        throw { status: 404, message: 'Código no encontrado' }
      }

      const gc = await tx.giftCard.findUnique({ where: { id: giftCard[0].id } })
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

      const walletRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "Wallet" WHERE "userId" = $1 FOR UPDATE',
        user.id
      )

      let wallet: any
      if (!walletRows || walletRows.length === 0) {
        wallet = await tx.wallet.create({
          data: { userId: user.id }
        })
      } else {
        wallet = await tx.wallet.findUnique({ where: { id: walletRows[0].id } })
      }

      const balanceBefore = wallet!.balance

      await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: { increment: gc.originalAmount },
          totalEarned: { increment: gc.originalAmount },
        }
      })

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: 'GIFT_CARD_REDEEM',
          amount: gc.originalAmount,
          balanceBefore,
          balanceAfter: balanceBefore + gc.originalAmount,
          referenceId: gc.id,
          description: `Canje de Gift Card ${gc.code}`,
        }
      })

      await tx.giftCard.update({
        where: { id: gc.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedByUserId: user.id,
          transactionId: transaction.id,
        }
      })

      return { newBalance: balanceBefore + gc.originalAmount, amount: gc.originalAmount }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[GiftCard Redeem] Error:', error)
    if (error.status) {
      return NextResponse.json({ error: 'Error al canjear la Gift Card' }, { status: error.status })
    }
    return NextResponse.json({ error: 'Error al canjear la Gift Card' }, { status: 500 })
  }
}
