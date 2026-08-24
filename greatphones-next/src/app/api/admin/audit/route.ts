import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { auditar, anular, listAudit } from '@/lib/audit'
import { z } from 'zod'

const ENTITY_TYPES = ['Product', 'Accessory', 'Order', 'Repair', 'Quote', 'PreOrder'] as const

const AnularSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().min(1, 'ID requerido'),
  reason: z.string().min(1, 'El motivo es obligatorio'),
  operator: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || undefined
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 40)
    const res = await listAudit({ page, limit, entityType, search })
    return NextResponse.json(res)
  } catch (error) {
    console.error('[Admin Audit GET]', error)
    return NextResponse.json({ error: 'Error al obtener la auditoría' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = AnularSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const d = parsed.data
    try {
      await anular({
        entityType: d.entityType as any,
        entityId: d.entityId,
        reason: d.reason,
        operator: d.operator || null,
      })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Error al anular' }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'Operación anulada correctamente' })
  } catch (error) {
    console.error('[Admin Audit POST]', error)
    return NextResponse.json({ error: 'Error al anular' }, { status: 500 })
  }
}

// Permitir registrar también el registro de auditoría de creación al crear una entidad
export async function PUT(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = z
      .object({
        entityType: z.enum(ENTITY_TYPES),
        entityId: z.string().min(1),
        action: z.enum(['CREACION', 'UPDATE', 'CORRECCION']),
        reason: z.string().optional(),
        operator: z.string().optional(),
      })
      .safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    await auditar({
      entityType: d.entityType as any,
      entityId: d.entityId,
      action: d.action as any,
      reason: d.reason || null,
      operator: d.operator || null,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Audit PUT]', error)
    return NextResponse.json({ error: 'Error al registrar auditoría' }, { status: 500 })
  }
}