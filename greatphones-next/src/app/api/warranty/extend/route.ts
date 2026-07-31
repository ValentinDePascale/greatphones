import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

const PLANS: Record<string, { months: number; price: number; label: string }> = {
  '12m': { months: 12, price: 85000, label: '12 meses' },
  '24m': { months: 24, price: 150000, label: '24 meses' },
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { code, imei, plan, price } = body

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
    if (typeof price !== 'number' || price !== planConfig.price) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
    })

    if (!order) {
      return NextResponse.json({ error: 'No se encontró una orden con ese código' }, { status: 404 })
    }

    const createdAt = new Date(order.createdAt)
    const daysSincePurchase = Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePurchase > 90) {
      return NextResponse.json({ error: 'Ya pasaron los 90 días desde la compra. No es posible extender la garantía.' }, { status: 400 })
    }

    if (order.warranty?.includes('12') || order.warranty?.includes('24')) {
      return NextResponse.json({ error: 'Esta orden ya tiene una garantía extendida.' }, { status: 400 })
    }

    const existingActive = await prisma.warrantyExtend.findFirst({
      where: { orderId: order.id, imei, status: 'ACTIVE' }
    })
    if (existingActive) {
      return NextResponse.json({ error: 'Ya tenés una extensión de garantía activa para este equipo.' }, { status: 400 })
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + planConfig.months)

    const warrantyExtend = await prisma.warrantyExtend.create({
      data: {
        orderId: order.id,
        imei,
        plan,
        months: planConfig.months,
        price: planConfig.price,
        status: 'ACTIVE',
        startDate,
        endDate,
      }
    })

    const expiresStr = endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

    return NextResponse.json({
      success: true,
      id: warrantyExtend.id,
      plan: warrantyExtend.plan,
      months: warrantyExtend.months,
      startDate: warrantyExtend.startDate.toISOString(),
      endDate: warrantyExtend.endDate.toISOString(),
      expiresAt: expiresStr,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
