import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { z } from 'zod'

const VentaSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto con stock'),
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
  accesorios: z
    .array(z.object({ nombre: z.string(), precio: z.number().int().default(0) }))
    .optional(),
  obs: z.string().optional(),
  entregarRegalos: z.boolean().optional(),
  operador: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const productos = await prisma.product.findMany({
      where: { deletedAt: null, isPreorder: false, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
      take: 500,
      select: {
        id: true,
        name: true,
        brand: true,
        sub: true,
        storage: true,
        color: true,
        condition: true,
        battery: true,
        price: true,
        cost: true,
        stock: true,
        reserved: true,
        imageUrl: true,
      },
    })
    return NextResponse.json(productos)
  } catch (error) {
    console.error('[Ops Ventas GET]', error)
    return NextResponse.json({ error: 'Error al obtener productos en stock' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = VentaSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 },
      )
    const d = parsed.data

    const producto = await prisma.product.findUnique({ where: { id: d.productId } })
    if (!producto || producto.deletedAt || producto.isPreorder) {
      return NextResponse.json({ error: 'Ese producto no está disponible' }, { status: 400 })
    }
    const disponible = (producto.stock || 0) - (producto.reserved || 0)
    if (disponible < 1) {
      return NextResponse.json(
        { error: 'Sin stock real disponible para ese producto' },
        { status: 400 },
      )
    }

    const accs = (d.accesorios || []).filter(a => a.nombre)
    const totalAcc = accs.reduce((s, a) => s + a.precio, 0)
    const totalOperacion = d.precioVenta + totalAcc

    const usdRate = (global as unknown as { dolarVenta?: number }).dolarVenta || 1000
    const usdPesos = Math.round(Number(d.usd || 0) * usdRate)
    const totalCobradoPesos = d.efectivo + d.transferencia + d.cuotas + usdPesos

    // No prorratear: registrar exactamente lo que se cobró en cada medio
    const efCel = d.efectivo
    const trCel = d.transferencia
    const cuCel = d.cuotas
    const usdCel = Number(d.usd || 0)

    const numero = 'VTA-' + Date.now().toString().slice(-7)
    const costo = producto.cost || 0
    const gananciaTeorica = d.precioVenta - costo
    const gananciaCobrada = totalCobradoPesos - costo

    for (const a of accs) {
      const acc = await prisma.accessory.findFirst({ where: { name: a.nombre, isActive: true } })
      if (acc) {
        const dispAcc = (acc.stock || 0) - (acc.reserved || 0)
        if (dispAcc < 1)
          return NextResponse.json({ error: `Accesorio sin stock: ${a.nombre}` }, { status: 400 })
      }
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id: producto.id },
        data: { stock: { decrement: 1 }, sold: { increment: 1 } },
      }),
      ...accs.map(a =>
        prisma.accessory.updateMany({
          where: { name: a.nombre, isActive: true },
          data: { stock: { decrement: 1 } },
        }),
      ),
    ])

    const medios: Array<{ medio: string; monto: number; esUSD?: boolean }> = [
      { medio: 'Efectivo', monto: efCel },
      { medio: 'Transferencia', monto: trCel },
      { medio: 'Cuotas', monto: cuCel },
    ]
    if (d.usd > 0) medios.push({ medio: 'USD', monto: usdCel, esUSD: true })
    for (const m of medios) {
      if (m.esUSD ? (m.monto || 0) <= 0 : m.monto <= 0) continue
      await registerEntry({
        source: 'VENTA',
        operationId: numero,
        description: `Venta de ${producto.name} a ${d.cliente}`,
        category: 'VENTA_PROPIA',
        type: 'INGRESO',
        means:
          m.medio === 'Efectivo'
            ? 'EFECTIVO'
            : m.medio === 'Transferencia'
              ? 'TRANSFERENCIA'
              : m.medio === 'Cuotas'
                ? 'CUOTAS'
                : 'USD',
        amount: m.esUSD ? 0 : m.monto,
        amountUsd: m.esUSD ? m.monto : null,
        operator: d.operador || d.vendedor || admin.id,
        createdById: admin.id,
        metadata: { productId: producto.id, accesorios: accs.map(a => a.nombre) },
      }).catch(e => console.error('[Ops Ventas] asiento:', e))
    }

    await auditar({
      entityType: 'Product',
      entityId: producto.id,
      action: 'VENTA',
      reason: 'Venta de equipo',
      operator: d.operador,
      createdById: admin.id,
    }).catch(() => {})

    return NextResponse.json(
      {
        numero,
        equipo: producto.name,
        precio: d.precioVenta,
        gananciaTeorica,
        gananciaCobrada,
        totalOperacion,
        totalCobradoPesos,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[Ops Ventas POST]', error)
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }
}
