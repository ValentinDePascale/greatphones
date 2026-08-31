import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { productCache } from '@/lib/cache'
import { z } from 'zod'

// La Lista de Precios guarda los colores en inglés (Apple), pero el resto
// de la app (catálogo público, círculos de color en admin/productos) usa
// el catálogo MODEL_COLORS en español de public/lib/constants.js. Sin esta
// traducción, el color queda guardado pero no matchea ningún nombre
// conocido y se muestra como "no disponible" en el detalle del producto.
const COLOR_EN_TO_ES: Record<string, string> = {
  'Blue': 'Azul', 'Midnight': 'Medianoche', 'Purple': 'Púrpura', 'Red': 'Rojo',
  'Starlight': 'Luz Estelar', 'Yellow': 'Amarillo', 'Black': 'Negro', 'White': 'Blanco',
  'Green': 'Verde', 'Pink': 'Rosa', 'Orange': 'Naranja Coral', 'Silver': 'Plateado',
  'Gold': 'Dorado', 'Gray': 'Gris Espacial', 'Space Gray': 'Gris Espacial',
  'Rose Gold': 'Rosa', 'Deep Purple': 'Púrpura Intenso', 'Graphite': 'Grafito',
  'Midnight Black': 'Negro', 'Sierra Blue': 'Azul Sierra', 'Alpine Green': 'Verde Alpino',
  'Space Black': 'Negro Espacial', 'Natural Titanium': 'Titanio Natural',
  'Blue Titanium': 'Titanio Azul', 'White Titanium': 'Titanio Blanco',
  'Black Titanium': 'Titanio Negro', 'Desert Titanium': 'Titanio Desierto',
  'Aqua': 'Verde Agua', 'Ultra Violet': 'Azul Ultramar', 'Teal': 'Verde Azulado',
  'Ultramarine': 'Azul Ultramar', 'Pacific Blue': 'Azul Pacífico', 'Coral': 'Coral',
  'Indigo Titanium': 'Titanio Índigo', 'Midnight Green': 'Verde Medianoche',
}
function colorToSpanish(name: string | undefined | null): string | null {
  if (!name) return null
  return COLOR_EN_TO_ES[name] || name
}

const CompraSchema = z.object({
  tipo: z.enum(['COMPRA', 'CONSIGNACION']),
  fecha: z.string().optional(),
  proveedor: z.string().optional(),
  cuil: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  marca: z.string().optional(),
  imei: z.union([z.string().regex(/^\d{15}$/, 'El IMEI debe tener 15 números'), z.literal('')]).optional(),
  color: z.string().optional(),
  storage: z.string().optional(),
  imageUrl: z.string().optional(),
  battery: z.number().int().min(0).max(100).optional(),
  estadoFisico: z.string().optional(),
  precioCompra: z.number().int().min(0).default(0),
  precioConsig: z.number().int().min(0).default(0),
  formaPago: z.string().optional(),
  reparacion: z.union([z.boolean(), z.enum(['Sí', 'Si', 'No'])]).optional().transform(v => {
    if (typeof v === 'boolean') return v
    if (v === 'Sí' || v === 'Si') return true
    return false
  }),
  costoRep: z.number().int().min(0).default(0),
  precioVenta: z.number().int().min(0).default(0),
  obs: z.string().optional(),
  esPreventa: z.union([z.boolean(), z.enum(['No', 'Si', 'no', 'si'])]).optional().transform(v => {
    if (typeof v === 'boolean') return v
    if (v === 'Si' || v === 'si') return true
    return false
  }),
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

    // Validar preventa antes de abrir transacción
    let preOrderToUpdate = null
    if (d.esPreventa && d.nPreAsociada) {
      preOrderToUpdate = await prisma.preOrder.findUnique({ where: { id: d.nPreAsociada } })
      if (!preOrderToUpdate) return NextResponse.json({ error: 'Preventa no encontrada' }, { status: 404 })
    }

    // Calcular estado y stock dinámicamente
    const necesitaArreglo = d.reparacion === true
    const esPreventa = d.esPreventa === true
    const status = necesitaArreglo ? 'IN_REPAIR' : (esPreventa ? 'RESERVED' : 'IN_STOCK')
    const stock = (necesitaArreglo || esPreventa) ? 0 : 1
    const costo = d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig

    // Precio de venta: prioridad manual (precioVenta) > Lista de Precios > margen por defecto
    let precioLista = 0
    const priceEntry = await prisma.priceList.findFirst({
      where: {
        category: 'CELULAR',
        modelo: d.modelo,
        ...(d.storage ? { almacenamiento: d.storage } : {}),
      },
      orderBy: { almacenamiento: 'asc' },
    })
    if (priceEntry?.precioARS) precioLista = priceEntry.precioARS
    const precioFinal = d.precioVenta > 0 ? d.precioVenta : (precioLista > 0 ? precioLista : Math.round(costo * 1.3))
    const colorEs = colorToSpanish(d.color)

    // Crear dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el producto
      const producto = await tx.product.create({
        data: {
          name: d.modelo,
          brand: d.marca || 'Genérico',
          ico: 'smartphone',
          condition: d.estadoFisico || 'Bueno',
          price: precioFinal,
          cost: costo,
          stock: stock,
          type: 'celular',
          imei: d.imei || undefined,
          color: colorEs || undefined,
          storage: d.storage || undefined,
          imageUrl: d.imageUrl || undefined,
          battery: d.battery ?? undefined,
          description: d.obs || `Compra: ${numero}${d.proveedor ? ' de ' + d.proveedor : ''}`,
          deletedAt: null,
        },
      })

      // Crear el inventoryItem vinculado al producto
      const item = await tx.inventoryItem.create({
        data: {
          code: numero,
          imei: d.imei || `NOIMEI-${Date.now().toString().slice(-9)}`,
          brand: d.marca || 'Generico',
          modelName: d.modelo,
          color: colorEs || null,
          storage: d.storage || null,
          imageUrl: d.imageUrl || null,
          deviceType: 'celular',
          purchasePrice: d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig,
          cosmeticCondition: d.estadoFisico || 'Bueno',
          purchasedFrom: d.proveedor || null,
          notes: d.obs || null,
          status: status as any,
          targetPrice: precioFinal > 0 ? precioFinal : null,
          batteryHealth: d.battery ?? null,
          repairCost: d.costoRep > 0 ? d.costoRep : null,
          productId: producto.id,
          createdById: admin.id,
        },
      })

      // Vincular a preventa si corresponde
      if (esPreventa && preOrderToUpdate) {
        await tx.preOrder.update({
          where: { id: d.nPreAsociada },
          data: {
            status: 'COMPRADO',
            inventoryItemId: item.id,
            notes: (preOrderToUpdate.notes || '') + ` | Compra vinculada: ${numero}`,
          },
        })
      }

      return { item, producto }
    })

    // Registrar asiento contable fuera de transacción. Siempre queda algo
    // visible en Mis Operaciones: EGRESO si es COMPRA (sale plata de caja),
    // NEUTRO si es CONSIGNACIÓN (no sale plata todavía, pero la operación
    // debe quedar registrada — antes no se creaba ningún asiento acá y la
    // compra desaparecía sin dejar rastro contable).
    const monto = d.tipo === 'COMPRA' ? d.precioCompra : d.precioConsig
    if (monto > 0) {
      await registerEntry({
        source: 'COMPRA',
        operationId: numero,
        description: `${d.tipo === 'COMPRA' ? 'Compra' : 'Consignación'}: ${d.modelo}${d.imei ? ' IMEI:' + d.imei : ''}`,
        category: 'COMPRA_EQUIPO',
        type: d.tipo === 'COMPRA' ? 'EGRESO' : 'NEUTRO',
        means: d.formaPago === 'Transferencia' ? 'TRANSFERENCIA' : 'EFECTIVO',
        amount: monto,
        operator: d.operador || admin.id,
        createdById: admin.id,
      }).catch(e => console.error('[Ops Compras] asiento:', e))
    }

    // Auditar fuera de transacción
    await auditar({
      entityType: 'Product',
      entityId: result.producto.id,
      action: 'CREACION',
      reason: `Compra de equipo (${d.modelo})${necesitaArreglo ? ' - Necesita arreglo' : ''}${esPreventa ? ' - Para preventa' : ''}`,
      operator: d.operador,
    }).catch(() => {})

    // Limpiar cache de productos
    productCache.clear()

    return NextResponse.json({ numero, estado: status, item: result.item }, { status: 201 })
  } catch (error) {
    console.error('[Ops Compras POST]', error)
    return NextResponse.json({ error: 'Error al registrar la compra' }, { status: 500 })
  }
}
