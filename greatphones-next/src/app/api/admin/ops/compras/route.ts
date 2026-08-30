import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { z } from 'zod'

const CompraSchema = z.object({
  tipo: z.enum(['COMPRA', 'CONSIGNACION']),
  fecha: z.string().optional(),
  proveedor: z.string().optional(),
  cuil: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  marca: z.string().optional(),
  imei: z.string().optional(),
  color: z.string().optional(),
  estadoFisico: z.string().optional(),
  precioCompra: z.number().int().min(0).default(0),
  precioConsig: z.number().int().min(0).default(0),
  formaPago: z.string().optional(),
  reparacion: z.string().optional(),
  costoRep: z.number().int().min(0).default(0),
  precioVenta: z.number().int().min(0).default(0),
  obs: z.string().optional(),
  esPreventa: z.enum(['No', 'Si']).optional(),
  nPreAsociada: z.string().optional(),
  operador: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    // Preventas pendientes para vincular en la compra
    const preorders = await prisma.preOrder.findMany({
      where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, code: true, clientName: true, productModelName: true },
    })
    return NextResponse.json(preorders)
  } catch (error) {
    console.error('[Ops Compras GET]', error)
    return NextResponse.json({ error: 'Error al obtener preventas para vincular' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = CompraSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data

    if (d.tipo === 'COMPRA' && d.precioCompra <= 0) return NextResponse.json({ error: 'Para COMPRA, el precio de compra debe ser > 0' }, { status: 400 })
    if (d.tipo === 'CONSIGNACION' && d.precioConsig <= 0) return NextResponse.json({ error: 'Para CONSIGNACION, el precio acordado debe ser > 0' }, { status: 400 })

    const numero = 'CMP-' + Date.now().toString().slice(-7)
    const estadoInicial = d.reparacion === 'Sí' ? 'IN_REPAIR' : 'IN_STOCK'

    // Crear el equipo en Inventario e inmediatamente en Productos
    const item = await prisma.inventoryItem.create({
      data: {
        code: numero,
        imei: d.imei || `NOIMEI-${Date.now().toString().slice(-9)}`,
        brand: d.marca || 'Generico',
        modelName: d.modelo,
        color: d.color || null,
        deviceType: 'celular',
        purchasePrice: d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig,
        cosmeticCondition: d.estadoFisico || 'Bueno',
        purchasedFrom: d.proveedor || null,
        notes: d.obs || null,
        status: estadoInicial as any,
        targetPrice: d.precioVenta > 0 ? d.precioVenta : null,
        createdById: admin.id,
      },
    })

    // Crear también en Productos para que aparezca en el catálogo
    const producto = await prisma.product.create({
      data: {
        name: d.modelo,
        brand: d.marca || 'Genérico',
        ico: 'smartphone',
        condition: d.estadoFisico || 'Bueno',
        price: d.precioVenta > 0 ? d.precioVenta : (d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig) * 1.3, // 30% margen por defecto
        cost: d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig,
        stock: 1,
        type: 'USADO',
        imei: d.imei || undefined,
        color: d.color || undefined,
        description: d.obs || `Compra: ${numero}${d.proveedor ? ' de ' + d.proveedor : ''}`,
        deletedAt: null,
      },
    }).catch(e => {
      console.error('[Ops Compras] Error creando producto:', e)
      return null
    })

    // Vincular a preventa si corresponde
    if (d.esPreventa === 'Si' && d.nPreAsociada) {
      await prisma.preOrder.update({
        where: { id: d.nPreAsociada },
        data: {
          status: 'COMPRADO',
          notes: ((await prisma.preOrder.findUnique({ where: { id: d.nPreAsociada } }))?.notes || '') + ` | Compra vinculada: ${numero}`,
        },
      }).catch(() => {})
    }

    // Asiento contable: EGRESO si compra (sale plata), NEUTRO si consignación
    const monto = d.tipo === 'COMPRA' ? d.precioCompra : 0
    if (monto > 0) {
      await registerEntry({
        source: 'COMPRA',
        operationId: numero,
        description: `Compra: ${d.modelo}${d.imei ? ' IMEI:' + d.imei : ''}`,
        category: 'COMPRA_EQUIPO',
        type: 'EGRESO',
        means: d.formaPago === 'Transferencia' ? 'TRANSFERENCIA' : 'EFECTIVO',
        amount: monto,
        operator: d.operador || admin.id,
        createdById: admin.id,
      }).catch(e => console.error('[Ops Compras] asiento:', e))
    }

    await auditar({ entityType: 'Product', entityId: item.id, action: 'CREACION', reason: 'Registro de compra de equipo', operator: d.operador }).catch(() => {})
    productCacheClear?.()

    return NextResponse.json({ numero, estado: estadoInicial, item }, { status: 201 })
  } catch (error) {
    console.error('[Ops Compras POST]', error)
    return NextResponse.json({ error: 'Error al registrar la compra' }, { status: 500 })
  }
}

// Se importa sin romper
function productCacheClear() { try { (global as any).productCache?.clear?.() } catch {} }