import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { z } from 'zod'

const VentaSchema = z.object({
  inventoryItemId: z.string().min(1, 'Seleccioná un equipo en stock'),
  fecha: z.string().optional(),
  precioVenta: z.number().int().min(1, 'El precio de venta debe ser > 0'),
  cliente: z.string().min(1, 'El cliente es obligatorio'),
  cuil: z.string().optional(),
  tel: z.string().optional(),
  vendedor: z.string().optional(),
  efectivo: z.number().int().min(0).default(0),
  transferencia: z.number().int().min(0).default(0),
  cuotas: z.number().int().min(0).default(0),
  usd: z.number().min(0).default(0),
  accesorios: z.array(z.object({ nombre: z.string(), precio: z.number().int().default(0) })).optional(),
  obs: z.string().optional(),
  entregarRegalos: z.boolean().optional(),
  operador: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const equipos = await prisma.inventoryItem.findMany({
      where: { status: 'IN_STOCK' },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: { id: true, code: true, imei: true, modelName: true, brand: true, color: true, storage: true, targetPrice: true, purchasePrice: true, cosmeticCondition: true },
    })
    return NextResponse.json(equipos)
  } catch (error) {
    console.error('[Ops Ventas GET]', error)
    return NextResponse.json({ error: 'Error al obtener equipos en stock' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = VentaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data

    const item = await prisma.inventoryItem.findUnique({ where: { id: d.inventoryItemId } })
    if (!item || item.status !== 'IN_STOCK') {
      return NextResponse.json({ error: 'Ese equipo no está en stock' }, { status: 400 })
    }

    const accs = (d.accesorios || []).filter(a => a.nombre)
    const totalAcc = accs.reduce((s, a) => s + a.precio, 0)
    const totalOperacion = d.precioVenta + totalAcc

    // USD → pesos (cotización fallback)
    const usdRate = (global as any).dolarVenta || 1000
    const usdPesos = Math.round(Number(d.usd || 0) * usdRate)
    const totalCobradoPesos = d.efectivo + d.transferencia + d.cuotas + usdPesos

    // Prorrateo proporcional entre celular y accesorios
    const prorratear = (monto: number) => {
      if (totalOperacion <= 0 || !monto) return 0
      return Math.round((d.precioVenta / totalOperacion) * monto)
    }
    const efCel = prorratear(d.efectivo), trCel = prorratear(d.transferencia), cuCel = prorratear(d.cuotas), usdCel = prorratear(d.usd)

    const numero = 'VTA-' + Date.now().toString().slice(-7)
    const costo = item.purchasePrice || 0
    const gananciaTeorica = d.precioVenta - costo
    const gananciaCobrada = (efCel + trCel + cuCel + Math.round((usdCel || 0) * usdRate)) - costo

    // Crear Order y Sale (venta en tienda) + marcar vendido el equipo
    await prisma.$transaction([
      prisma.inventoryItem.update({ where: { id: item.id }, data: { status: 'SOLD', soldAt: new Date(), soldById: admin.id, salePrice: d.precioVenta } }),
    ])

    // Asientos contables por cada medio con monto > 0 (el celular)
    const medios: Array<{ medio: string; monto: number; esUSD?: boolean }> = [
      { medio: 'Efectivo', monto: efCel },
      { medio: 'Transferencia', monto: trCel },
      { medio: 'Cuotas', monto: cuCel },
    ]
    if (d.usd > 0) medios.push({ medio: 'USD', monto: d.usd, esUSD: true })
    for (const m of medios) {
      if (m.esUSD ? (m.monto || 0) <= 0 : m.monto <= 0) continue
      await registerEntry({
        source: 'VENTA',
        operationId: numero,
        description: `Venta de ${item.modelName} a ${d.cliente}`,
        category: 'VENTA_PROPIA',
        type: 'INGRESO',
        means: m.medio === 'Efectivo' ? 'EFECTIVO' : m.medio === 'Transferencia' ? 'TRANSFERENCIA' : m.medio === 'Cuotas' ? 'CUOTAS' : 'USD',
        amount: m.esUSD ? 0 : m.monto,
        amountUsd: m.esUSD ? m.monto : null,
        operator: d.operador || d.vendedor || admin.id,
        createdById: admin.id,
      }).catch(e => console.error('[Ops Ventas] asiento:', e))
    }

    await auditar({ entityType: 'Product', entityId: item.id, action: 'CORRECCION', reason: 'Venta de equipo', operator: d.operador }).catch(() => {})

    return NextResponse.json({
      numero,
      equipo: item.modelName,
      precio: d.precioVenta,
      gananciaTeorica, gananciaCobrada,
      totalOperacion, totalCobradoPesos,
    }, { status: 201 })
  } catch (error) {
    console.error('[Ops Ventas POST]', error)
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }
}