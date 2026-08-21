import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { z } from 'zod'

const CouponPatchSchema = z.object({
  status: z.enum(['ACTIVE', 'USED', 'EXPIRED']).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const parsed = CouponPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const { status, expiresAt } = parsed.data

    const existing = await prisma.coupon.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 })
    }

    const data: any = {}
    if (status) data.status = status
    if (expiresAt !== undefined) data.expiresAt = expiresAt

    const updated = await prisma.coupon.update({ where: { id }, data })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Admin Coupon PATCH]', error)
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 })
  }
}
