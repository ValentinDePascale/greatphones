import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { z } from 'zod'

const EntregaSchema = z.object({
  preOrderId: z.string().min(1, 'Seleccioná una preventa'),
  inventoryItemId: z.string().optional(),
  fecha: z.string().optional(),
  efectivo: z.number().int().min(0).default(0),
  transferencia: z.number().int().min(0).default(0),
  cuotas: z.number().int().min(0).default(0),
  usd: z.number().min(0).default(0),
  accesorios: z
    .array(z.object({ nombre: z.string(), precio: z.number().int().default(0) }))
    .optional(),
  obs: z.string().optional(),
  operador: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    // Preventas con compra lista o saldo, pendientes de entrega
    const preorders = await prisma.preOrder.findMany({
      where: { deletedAt: null, status: { in: ['COMPRADO', 'PENDING', 'ENTREGADO_SALDO'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: true },
    })
    // Calcular saldo pendiente: price - (cobradoApprox store en metadata? usar price como referencia)
    return NextResponse.json(preorders.map(p => ({ ...p, saldo: p.price })))
  } catch (error) {
    console.error('[Ops Entrega GET]', error)
    return NextResponse.json({ error: 'Error al obtener preventas para entrega' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = EntregaSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 },
      )
    const d = parsed.data

    const pre = await prisma.preOrder.findUnique({ where: { id: d.preOrderId } })
    if (!pre) return NextResponse.json({ error: 'Preventa no encontrada' }, { status: 404 })

    const accs = (d.accesorios || []).filter(a => a.nombre)
    const totalAcc = accs.reduce((s, a) => s + a.precio, 0)
    if (totalAcc > 0 && !d.inventoryItemId)
      return NextResponse.json(
        { error: 'Para entregar con acceso esos, seleccioná el equipo' },
        { status: 400 },
      )

    // Cobro del saldo
    const saldo = pre.price || 0
    const cobradoAhoraPesos =
      d.efectivo + d.transferencia + d.cuotas + Math.round((d.usd || 0) * 1000)

    // Marcar el equipo como vendido si se eligió
    if (d.inventoryItemId) {
      await prisma.inventoryItem
        .update({
          where: { id: d.inventoryItemId },
          data: { status: 'SOLD', soldAt: new Date(), soldById: admin.id },
        })
        .catch(e => console.error('[Ops Entrega] stock:', e))
    }

    const numero = 'PRE-ENTREGA-' + Date.now().toString().slice(-7)

    // Asientos del saldo cobrado (incluye USD)
    const medios: Array<{
      m: string
      v: number
      pm: 'EFECTIVO' | 'TRANSFERENCIA' | 'CUOTAS' | 'USD'
      esUSD?: boolean
    }> = [
      { m: 'Efectivo', v: d.efectivo, pm: 'EFECTIVO' as const },
      { m: 'Transferencia', v: d.transferencia, pm: 'TRANSFERENCIA' as const },
      { m: 'Cuotas', v: d.cuotas, pm: 'CUOTAS' as const },
    ]
    if (d.usd && d.usd > 0)
      medios.push({ m: 'USD', v: Number(d.usd), pm: 'USD' as const, esUSD: true })
    for (const x of medios) {
      if (x.esUSD ? (x.v || 0) <= 0 : x.v <= 0) continue
      await registerEntry({
        source: 'PREVENTA_ENTREGA',
        operationId: pre.code,
        description: `Entrega preventa ${pre.code} — saldo cobrado`,
        category: 'VENTA_PROPIA',
        type: 'INGRESO',
        means: x.pm,
        amount: x.esUSD ? 0 : x.v,
        amountUsd: x.esUSD ? x.v : null,
        operator: d.operador || admin.id,
        createdById: admin.id,
      }).catch(e => console.error('[Ops Entrega] asiento:', e))
    }

    await prisma.preOrder.update({
      where: { id: pre.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        notes: (pre.notes || '') + ` | Entregado ${new Date().toISOString()}`,
      },
    })

    return NextResponse.json(
      {
        numero,
        preventa: pre.code,
        saldo,
        cobradoAhora: cobradoAhoraPesos,
        accesorios: totalAcc,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[Ops Entrega POST]', error)
    return NextResponse.json({ error: 'Error al registrar la entrega' }, { status: 500 })
  }
}
