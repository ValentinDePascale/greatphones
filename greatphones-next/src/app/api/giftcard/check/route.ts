import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIpKey } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const ip = clientIpKey(request)
    const limit = await rateLimit(`giftcard-check:${ip}`, 20, 60000)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera 1 minuto.' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || !/^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Formato de código inválido' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: normalizedCode }
    })

    if (!giftCard) {
      return NextResponse.json({ valid: false, error: 'Código no encontrado' })
    }

    if (giftCard.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        error: giftCard.status === 'REDEEMED'
          ? 'Esta Gift Card ya fue canjeada'
          : giftCard.status === 'EXPIRED'
            ? 'Esta Gift Card expiró'
            : 'Esta Gift Card no está disponible',
        status: giftCard.status,
        redeemedAt: giftCard.redeemedAt,
      })
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Esta Gift Card expiró', status: 'EXPIRED' })
    }

    return NextResponse.json({
      valid: true,
      amount: giftCard.originalAmount,
      code: giftCard.code,
    })
  } catch (error) {
    console.error('[GiftCard Check] Error:', error)
    return NextResponse.json({ error: 'Error al verificar código' }, { status: 500 })
  }
}
