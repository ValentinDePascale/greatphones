import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { z } from 'zod'

function genCode() {
  return 'REP-' + Date.now().toString().slice(-7)
}

const CreateSchema = z.object({
  tipo: z.string().optional(),
  fecha: z.string().optional(),
  cliente: z.string().min(1, 'Ingresá el nombre del cliente'),
  tel: z.string().optional(),
  equipo: z.string().min(1, 'Ingresá el equipo'),
  imei: z.string().optional(),
  pin: z.string().optional(),
  falla1: z.string().min(1, 'Describí la falla principal'),
  falla2: z.string().optional(),
  esDiagnostico: z.boolean().optional(),
  trabajos: z.array(z.string()).optional(),
  precioCalculado: z.number().optional(),
  detallePresupuesto: z.string().optional(),
  tiempoEstimadoHoras: z.number().optional(),
  precioCob: z.number().default(0),
  efec: z.number().default(0),
  transf: z.number().default(0),
  obs: z.string().optional(),
  operador: z.string().min(1, 'Seleccioná el operador'),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const where: any = { deletedAt: null }
    if (status && status !== 'TODOS') where.status = status
    const repairs = await prisma.repair.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(repairs)
  } catch (error) {
    console.error('[Taller Reparaciones GET]', error)
    return NextResponse.json({ error: 'Error al obtener reparaciones' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { id, status, thirdParty, deliveredAt } = body
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    if (!status && thirdParty === undefined && !deliveredAt) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    const data: any = {}
    if (status) data.status = status
    if (thirdParty !== undefined) data.thirdParty = !!thirdParty
    if (deliveredAt) data.deliveredAt = new Date(deliveredAt)
    if (status === 'DELIVERED' && !deliveredAt) data.deliveredAt = new Date()
    const updated = await prisma.repair.update({ where: { id }, data })
    await auditar({
      entityType: 'Repair',
      entityId: id,
      action: 'CORRECCION',
      reason: `Estado cambiado a ${status}${thirdParty ? ' (tercero)' : ''}`,
    }).catch(() => {})
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Taller Reparaciones PATCH]', error)
    return NextResponse.json({ error: 'Error al actualizar reparación' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 },
      )

    const d = parsed.data
    const code = genCode()

    const repair = await prisma.repair.create({
      data: {
        code,
        userId: admin.id,
        device: d.equipo,
        issue: d.falla1,
        type: d.tipo || 'Particular',
        clientName: d.cliente,
        clientPhone: d.tel || null,
        imei: d.imei || null,
        pin: d.pin || null,
        fault1: d.falla1,
        fault2: d.falla2 || null,
        jobs: d.trabajos || [],
        isDiagnosis: !!d.esDiagnostico,
        diagnosisStatus: d.esDiagnostico ? 'PENDIENTE' : null,
        priceCalc: d.precioCalculado || 0,
        estimatedHours: d.tiempoEstimadoHoras || null,
        pricePaid: d.precioCob || 0,
        operator: d.operador,
        status: d.esDiagnostico ? 'DIAGNOSIS' : 'PENDING',
      },
    })

    await auditar({
      entityType: 'Repair',
      entityId: repair.id,
      action: 'CREACION',
      reason: 'Ingreso de reparación',
    }).catch(() => {})

    // Cobro al ingresar: un asiento por medio (efectivo/transferencia)
    const efec = Math.round(d.efec)
    const transf = Math.round(d.transf)
    const cobrado = d.precioCob || 0
    if (cobrado > 0 && !d.esDiagnostico) {
      const medios: Array<{ means: 'EFECTIVO' | 'TRANSFERENCIA'; amount: number }> = []
      if (efec > 0) medios.push({ means: 'EFECTIVO', amount: efec })
      if (transf > 0) medios.push({ means: 'TRANSFERENCIA', amount: transf })
      for (const m of medios) {
        await registerEntry({
          source: 'REPAIR',
          operationId: repair.code,
          description: `Reparación ${repair.code} — ${d.equipo} — ${d.falla1}`,
          category: 'Reparaciones',
          type: 'INGRESO',
          means: m.means,
          amount: m.amount,
          operator: d.operador,
          createdById: admin.id,
        }).catch(e => console.error('[Taller Reparacion] asiento:', e))
      }
    }

    return NextResponse.json({ numero: code, ...repair }, { status: 201 })
  } catch (error) {
    console.error('[Taller Reparaciones POST]', error)
    return NextResponse.json({ error: 'Error al registrar la reparación' }, { status: 500 })
  }
}
