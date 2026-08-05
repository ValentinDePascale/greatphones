import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { requireSession } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

const PLANS: Record<string, { months: number; price: number; label: string }> = {
  '12m': { months: 12, price: 85000, label: '12 meses' },
  '24m': { months: 24, price: 150000, label: '24 meses' },
}

export async function POST(request: Request) {
  try {
    const user = await requireSession(request)
    const rl = await rateLimit(`warr-pref:${user.id}`, 5, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }
    const body = await request.json()
    const { code, imei, plan } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código de compra requerido' }, { status: 400 })
    }
    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'IMEI inválido (debe tener 15 dígitos)' }, { status: 400 })
    }
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const planConfig = PLANS[plan]

    const order = await prisma.order.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
    })
    if (!order) {
      return NextResponse.json({ error: 'No se encontró una orden con ese código' }, { status: 404 })
    }

    const createdAt = new Date(order.createdAt)
    const daysSincePurchase = Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePurchase > 365) {
      return NextResponse.json({ error: 'Ya pasaron los 12 meses desde la compra.' }, { status: 400 })
    }

    if (order.warranty?.includes('12') || order.warranty?.includes('24')) {
      return NextResponse.json({ error: 'Esta orden ya tiene garantía extendida.' }, { status: 400 })
    }

    const existingActive = await prisma.warrantyExtend.findFirst({
      where: { orderId: order.id, imei, status: { in: ['PENDING_PAYMENT', 'ACTIVE'] } }
    })
    if (existingActive) {
      return NextResponse.json({ error: 'Ya tenés una extensión de garantía pendiente o activa para este equipo.' }, { status: 400 })
    }

    const label = planConfig.label
    const title = `Extensión de Garantía ${label}`
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + planConfig.months)

    const wext = await prisma.warrantyExtend.create({
      data: {
        orderId: order.id,
        imei,
        plan,
        months: planConfig.months,
        price: planConfig.price,
        status: 'PENDING_PAYMENT',
        startDate,
        endDate,
      }
    })

    const item = {
      id: `wext-${wext.id}`,
      title,
      unit_price: planConfig.price,
      quantity: 1,
      currency_id: 'ARS',
    };
    const preferenceData = {
      items: [item],
      payer: {
        email: order.clientEmail || '',
        name: order.clientName || 'Cliente',
      },
      back_urls: {
        success: `${baseUrl}/success?wext=${wext.id}`,
        failure: `${baseUrl}/failure?wext=${wext.id}`,
        pending: `${baseUrl}/pending?wext=${wext.id}`,
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: `wext::${wext.id}`,
      auto_return: 'approved' as const,
    }

    const mpPreference = new Preference(client)
    const mpResponse = await mpPreference.create({ body: preferenceData })
    const preferenceId = mpResponse.id || ''
    if (!preferenceId) throw new Error('Failed to create MercadoPago preference')
    const initPoint = mpResponse.init_point

    await prisma.warrantyExtend.update({
      where: { id: wext.id },
      data: { mpPreferenceId: preferenceId }
    })

    return NextResponse.json({
      success: true,
      wextId: wext.id,
      initPoint,
    })
  } catch (error) {
    console.error('[Warranty Preference] Error:', error)
    return NextResponse.json({ error: 'Error al crear el pago. Intentá nuevamente.' }, { status: 500 })
  }
}
