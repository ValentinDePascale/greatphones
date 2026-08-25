import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { z } from 'zod'

const TomaSchema = z.object({
  id: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  impecable: z.number().int().min(0).default(0),
  bateria: z.number().int().min(0).default(0),
  pantalla: z.number().int().min(0).default(0),
  camara: z.number().int().min(0).default(0),
  microfono: z.number().int().min(0).default(0),
  parlante: z.number().int().min(0).default(0),
  tapa: z.number().int().min(0).default(0),
  marco: z.number().int().min(0).default(0),
  pin: z.number().int().min(0).default(0),
  orden: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const rows = await prisma.priceTradeIn.findMany({
      where: { active: true },
      orderBy: [{ orden: 'asc' }, { modelo: 'asc' }],
    })
    return NextResponse.json(rows)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = TomaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    const last = await prisma.priceTradeIn.findFirst({ orderBy: { orden: 'desc' } })
    const row = await prisma.priceTradeIn.create({
      data: { ...d, orden: d.orden || (last ? last.orden + 1 : 0), updatedBy: admin.id },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    const parsed = TomaSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const row = await prisma.priceTradeIn.update({
      where: { id: body.id },
      data: { ...parsed.data, updatedBy: admin.id },
    })
    return NextResponse.json(row)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    await prisma.priceTradeIn.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
