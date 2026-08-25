import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { z } from 'zod'

const PrecioSchema = z.object({
  id: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  almacenamiento: z.string().default(''),
  precioARS: z.number().int().min(0).default(0),
  preventaARS: z.number().int().min(0).default(0),
  descuentoARS: z.number().int().min(0).default(0),
  orden: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const rows = await prisma.priceList.findMany({
      where: { category: 'CELULAR' },
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
    const parsed = PrecioSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    const last = await prisma.priceList.findFirst({
      where: { category: 'CELULAR' },
      orderBy: { orden: 'desc' },
    })
    const row = await prisma.priceList.create({
      data: {
        category: 'CELULAR',
        modelo: d.modelo,
        almacenamiento: d.almacenamiento,
        precioARS: d.precioARS,
        preventaARS: d.preventaARS,
        descuentoARS: d.descuentoARS,
        orden: d.orden || (last ? last.orden + 1 : 0),
        active: d.active,
        updatedBy: admin.id,
      },
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
    const parsed = PrecioSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const row = await prisma.priceList.update({
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
    await prisma.priceList.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
