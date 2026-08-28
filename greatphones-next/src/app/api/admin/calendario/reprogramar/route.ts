import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { z } from 'zod'

const TIPOS = ['Reparaciones', 'Preventas', 'Pedidos', 'Cotizaciones', 'Arrepentimientos'] as const

const Schema = z.object({
  entityType: z.enum(TIPOS),
  entityId: z.string().min(1),
  date: z.string().min(1, 'Ingresá una fecha'),
})

/** Reprograma un pendiente del calendario a otro día (o lo restaura si date viene vacío). */
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const { entityType, entityId, date } = parsed.data
    const d = new Date(date + 'T12:00:00')
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })

    const row = await prisma.calendarOverride.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      update: { date: d, operator: admin.id },
      create: { entityType, entityId, date: d, operator: admin.id },
    })
    return NextResponse.json(row)
  } catch (error) {
    return handleRouteError(error)
  }
}

/** Quita la reprogramación: el pendiente vuelve a mostrarse en su fecha original. */
export async function DELETE(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    if (!entityType || !entityId || !(TIPOS as readonly string[]).includes(entityType))
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    await prisma.calendarOverride
      .delete({ where: { entityType_entityId: { entityType, entityId } } })
      .catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
