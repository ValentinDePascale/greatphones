import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import crypto from 'crypto'
import { requireSession } from '@/lib/auth-guard'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

function generateGiftCardCode(): string {
  const raw = crypto.randomBytes(6)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return `GP-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

const MIN_AMOUNT = 50000
const MAX_AMOUNT = 3000000

export async function POST(request: Request) {
  try {
    const auth = await requireSession(request)

    const body = await request.json()
    let { amount, recipientEmail, message } = body

    amount = parseInt(amount)
    if (isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json({ error: `El monto debe estar entre $${MIN_AMOUNT.toLocaleString('es-AR')} y $${MAX_AMOUNT.toLocaleString('es-AR')}` }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, email: true, name: true, phone: true, dni: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const code = generateGiftCardCode()

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const title = `Great Phones Gift Card $${amount.toLocaleString('es-AR')}`

    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        originalAmount: amount,
        remainingAmount: amount,
        status: 'PENDING',
        buyerEmail: user.email,
        recipientEmail: recipientEmail || null,
        message: message || null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    })

    const cleanDoc = user.dni ? user.dni.replace(/[^0-9]/g, '') : ''
    const idType = cleanDoc.length > 8 ? 'CUIT' : 'DNI'

    const preferenceData = {
      items: [
        {
          id: `gc-${giftCard.id}`,
          title,
          unit_price: amount,
          quantity: 1,
          currency_id: 'ARS',
        } as any,
      ],
      payer: {
        email: user.email,
        name: user.name || 'Great Phones',
        surname: '',
        phone: { number: user.phone || '0000000000' },
        identification: { type: idType, number: cleanDoc || '00000000' },
      },
      back_urls: {
        success: `${baseUrl}/success?gc=${giftCard.id}`,
        failure: `${baseUrl}/failure?gc=${giftCard.id}`,
        pending: `${baseUrl}/pending?gc=${giftCard.id}`,
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: `gc::${giftCard.id}`,
      auto_return: 'approved' as const,
      payment_types: { excluded_types: [] },
    }

    const mpPreference = new Preference(client)
    const mpResponse = await mpPreference.create({ body: preferenceData })
    const preferenceId = mpResponse.id || ''
    if (!preferenceId) throw new Error('Failed to create MercadoPago preference')
    const initPoint = mpResponse.init_point

    await prisma.giftCard.update({
      where: { id: giftCard.id },
      data: { mpPreferenceId: preferenceId }
    })

    return NextResponse.json({
      success: true,
      gcId: giftCard.id,
      initPoint,
    })
  } catch (error: any) {
    console.error('[GiftCard Preference] Error:', error)
    const status = error.status || 500
    return NextResponse.json({ error: 'Error al crear la Gift Card' }, { status })
  }
}
