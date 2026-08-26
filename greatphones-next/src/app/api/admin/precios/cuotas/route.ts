import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { z } from 'zod'

const CuotaSchema = z.object({
  id: z.string().optional(),
  cuotas: z.number().int().min(1),
  coeficiente: z.number().positive().default(1),
  activo: z.boolean().default(true),
  mostrar: z.boolean().default(true),
  observacion: z.string().optional(),
  orden: z.number().int().default(0),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const rows = await prisma.cuotasConfig.findMany({
      orderBy: [{ orden: 'asc' }, { cuotas: 'asc' }],
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
    const parsed = CuotaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    const row = await prisma.cuotasConfig.create({
      data: { ...d, updatedBy: admin.id },
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
    const parsed = CuotaSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const row = await prisma.cuotasConfig.update({
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
    await prisma.cuotasConfig.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
