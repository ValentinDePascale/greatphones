import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { z } from 'zod'

function genPreCode() {
  return 'PRE-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
}

const PreventaSchema = z.object({
  fecha: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  cliente: z.string().min(1, 'El cliente es obligatorio'),
  cuil: z.string().optional(),
  tel: z.string().optional(),
  vendedor: z.string().optional(),
  precioVenta: z.number().int().min(1, 'El precio pactado debe ser > 0'),
  efectivo: z.number().int().min(0).default(0),
  transferencia: z.number().int().min(0).default(0),
  cuotas: z.number().int().min(0).default(0),
  usd: z.number().min(0).default(0),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  obs: z.string().optional(),
  operador: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const preorders = await prisma.preOrder.findMany({
      where: { deletedAt: null, source: 'local' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(preorders)
  } catch (error) {
    console.error('[Ops Preventas GET]', error)
    return NextResponse.json({ error: 'Error al obtener preventas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = PreventaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data

    const cobradoPesos = d.efectivo + d.transferencia + d.cuotas + Math.round((d.usd || 0) * 1000)
    if (cobradoPesos <= 0) return NextResponse.json({ error: 'Debe registrarse al menos un cobro' }, { status: 400 })

    const code = genPreCode()
    const pre = await prisma.preOrder.create({
      data: {
        code,
        clientName: d.cliente,
        clientDni: d.cuil || null,
        clientPhone: d.tel || null,
        productModelName: d.modelo,
        price: d.precioVenta,
        status: 'PENDING',
        source: 'local',
        notes: d.obs || null,
        expectedDeliveryStart: d.fechaDesde ? new Date(d.fechaDesde) : null,
        expectedDeliveryEnd: d.fechaHasta ? new Date(d.fechaHasta) : null,
      },
    })

    // Asiento del cobro (efectivo/transferencia mostrados, cuotas como CUOTAS)
    const medios = [
      { m: 'Efectivo', v: d.efectivo, pm: 'EFECTIVO' as const },
      { m: 'Transferencia', v: d.transferencia, pm: 'TRANSFERENCIA' as const },
      { m: 'Cuotas', v: d.cuotas, pm: 'CUOTAS' as const },
    ]
    for (const x of medios) {
      if (x.v <= 0) continue
      await registerEntry({
        source: 'PREVENTA',
        operationId: code,
        description: `Preventa ${code} — ${d.modelo} para ${d.cliente}`,
        category: 'PREVENTA',
        type: 'INGRESO',
        means: x.pm,
        amount: x.v,
        operator: d.operador || admin.id,
        createdById: admin.id,
      }).catch(e => console.error('[Ops Preventas] asiento:', e))
    }

    return NextResponse.json({ numero: code, ...pre }, { status: 201 })
  } catch (error) {
    console.error('[Ops Preventas POST]', error)
    return NextResponse.json({ error: 'Error al registrar la preventa' }, { status: 500 })
  }
}