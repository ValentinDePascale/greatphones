import { NextResponse } from 'next/server'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { calcularPresupuesto, obtenerTarifario, type ReparacionKey } from '@/lib/reparaciones'
import { z } from 'zod'

const PresupuestoSchema = z.object({
  modelo: z.string().min(1, 'Seleccioná un modelo'),
  trabajos: z.record(z.string(), z.boolean()).optional(),
  esDiagnostico: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const tarifario = await obtenerTarifario()
    return NextResponse.json(tarifario)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = PresupuestoSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    const result = await calcularPresupuesto(d.modelo, (d.trabajos as Partial<Record<ReparacionKey, boolean>>) || {}, !!d.esDiagnostico)
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
