import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { sendCouponEmail } from '@/lib/email'
import { z } from 'zod'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 30

const CreateCouponSchema = z.object({
  userId: z.string().min(1, 'Usuario requerido'),
  amount: z.number().int().positive('El monto debe ser positivo'),
  expiresAt: z.coerce.date().nullable().optional(),
  code: z.string().optional(),
  countsToProfit: z.boolean().optional().default(true),
  note: z.string().optional(),
})

function generateCouponCode(prefix = 'GP'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${code}`
}

/**
 * Genera un código único. Acepta un `code` pedido por el admin, o autogenera
 * uno con prefijo GP. Reintenta hasta 5 veces si hay colisión.
 */
async function resolveUniqueCode(requested?: string): Promise<string> {
  let candidate = requested && requested.trim() ? requested.trim().toUpperCase() : generateCouponCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.coupon.findUnique({ where: { code: candidate }, select: { id: true } })
    if (!existing) return candidate
    candidate = generateCouponCode()
  }
  throw new Error('No se pudo generar un código único')
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit') ?? DEFAULT_LIMIT)))
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (status && ['ACTIVE', 'USED', 'EXPIRED'].includes(status)) where.status = status
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          orderCoupons: { select: { amountUsed: true } },
        },
      }),
      prisma.coupon.count({ where }),
    ])

    // Stats de ganancia. Un cupón "gift" (countsToProfit=false) o de
    // arrepentimiento/reembolso no cuenta como ingreso de la tienda.
    const allForStats = await prisma.coupon.findMany({
      select: {
        originalAmount: true,
        status: true,
        countsToProfit: true,
        orderCoupons: { select: { amountUsed: true } },
      },
    })

    let emitido = 0
    let usado = 0
    const counts = { ACTIVE: 0, USED: 0, EXPIRED: 0 }
    for (const c of allForStats) {
      if (c.countsToProfit) emitido += c.originalAmount
      const used = (c.orderCoupons || []).reduce((sum, oc) => sum + oc.amountUsed, 0)
      if (c.countsToProfit) usado += used
      if (c.countsToProfit) counts[c.status] += 1
    }

    const stats = {
      emitido,
      usado,
      pendiente: emitido - usado,
      counts,
    }

    return NextResponse.json({
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        originalAmount: c.originalAmount,
        remainingAmount: c.remainingAmount,
        status: c.status,
        source: c.source,
        countsToProfit: c.countsToProfit,
        note: c.note,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        usedAt: c.usedAt,
        user: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email, phone: c.user.phone } : null,
        usedAmount: (c.orderCoupons || []).reduce((sum, oc) => sum + oc.amountUsed, 0),
      })),
      stats,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[Admin Coupons GET]', error)
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = CreateCouponSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const { userId, amount, expiresAt, code, countsToProfit, note } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const uniqueCode = await resolveUniqueCode(code)

    const coupon = await prisma.coupon.create({
      data: {
        userId,
        code: uniqueCode,
        originalAmount: amount,
        remainingAmount: amount,
        status: 'ACTIVE',
        source: 'ADMIN',
        countsToProfit: countsToProfit ?? true,
        note: note || null,
        expiresAt: expiresAt || null,
      },
    })

    // Notificación in-app
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'PROMO',
          title: '¡Tenés un cupón! 🎉',
          text: `Se te asignó un cupón de $${amount.toLocaleString('es-AR')}${countsToProfit === false ? ' (regalo)' : ''}. Codigo: ${uniqueCode}. Revisalo en "Mis Cupones".`,
        },
      })
    } catch (notifErr) {
      console.error('[Admin Coupons] Error creating notification:', notifErr)
    }

    // Notificación por email
    const emailResult = await sendCouponEmail({
      email: user.email,
      userName: user.name,
      code: uniqueCode,
      amount,
      expiresAt: expiresAt || null,
      gift: countsToProfit === false,
      note: note || undefined,
    })

    return NextResponse.json(
      { coupon, emailSent: emailResult.success, notice: emailResult.success ? undefined : 'Cupón creado pero el email no se pudo enviar (email no configurado).' },
      { status: 201 },
    )
  } catch (error) {
    console.error('[Admin Coupons POST]', error)
    return NextResponse.json({ error: 'Error al crear cupón' }, { status: 500 })
  }
}
