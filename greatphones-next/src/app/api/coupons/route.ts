import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    const user = await requireSession(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId: user.id }
    if (status) where.status = status

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        originalAmount: true,
        remainingAmount: true,
        status: true,
        source: true,
        sourceId: true,
        expiresAt: true,
        createdAt: true,
        usedAt: true,
      }
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('[Coupons] Error:', error)
    const msg = (error instanceof Error ? error.message : (error as { message?: string })?.message) || 'Error al obtener cupones';
    const status = (error as { status?: number })?.status;
    if (status) {
      return NextResponse.json({ error: msg }, { status })
    }
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 })
  }
}
