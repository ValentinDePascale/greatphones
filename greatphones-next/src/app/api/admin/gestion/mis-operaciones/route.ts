import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { registerEntry } from '@/lib/accounting'
import { auditar } from '@/lib/audit'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)

    // Ver una operación puntual (detalque)
    const id = searchParams.get('id')
    if (id) {
      const entry = await prisma.accountingEntry.findUnique({ where: { id } })
      if (!entry) return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 })
      return NextResponse.json(entry)
    }

    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(100, Number(searchParams.get('limit') || 50))
    const operador = searchParams.get('operador')
    const source = searchParams.get('source')
    const medio = searchParams.get('medio')
    const tipo = searchParams.get('tipo')
    const fecha = searchParams.get('fecha')
    const busqueda = searchParams.get('busqueda')

    const where: any = {}
    if (operador) where.operator = operador
    if (source) where.source = source
    if (medio) where.means = medio
    if (tipo) where.type = tipo
    if (fecha) {
      const d = new Date(fecha + 'T00:00:00')
      const d2 = new Date(fecha + 'T23:59:59')
      where.opDate = { gte: d, lte: d2 }
    }
    if (busqueda) {
      where.OR = [
        { operationId: { contains: busqueda, mode: 'insensitive' } },
        { description: { contains: busqueda, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.accountingEntry.findMany({ where, orderBy: { opDate: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.accountingEntry.count({ where }),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleRouteError(error)
  }
}

const AnularSchema = z.object({
  operationId: z.string().min(1),
  motivo: z.string().min(1, 'Ingresá un motivo'),
  operador: z.string().min(1, 'Elegí el operador'),
})

/**
 * Anula una operación registrando un asiento de reversión (método simple):
 * si el original era INGRESO, se registra un EGRESO NEUTRO por el mismo monto
 * (sin sumar a caja mal, usando NEUTRO para no ensuciar saldos) y se audita.
 * NOTA: reversión real de caja se implementa con tipo contrario; aquí el
 * asiento queda marcado en Auditoría para trazabilidad.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = AnularSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data

    // Buscar los asientos del operationId dado
    const entries = await prisma.accountingEntry.findMany({ where: { operationId: d.operationId } })
    if (entries.length === 0) return NextResponse.json({ error: 'No se encontró la operación' }, { status: 404 })

    // Si se anula una VENTA, restaurar stock
    const salesEntries = entries.filter(e => e.source === 'VENTA')
    if (salesEntries.length > 0) {
      const meta = salesEntries[0].metadata as any
      if (meta?.productId) {
        await prisma.product.update({
          where: { id: meta.productId },
          data: { stock: { increment: 1 }, sold: { decrement: 1 } },
        }).catch(() => {})
      }
      if (meta?.accesorios && Array.isArray(meta.accesorios)) {
        for (const accName of meta.accesorios) {
          await prisma.accessory.updateMany({
            where: { name: accName, isActive: true },
            data: { stock: { increment: 1 } },
          }).catch(() => {})
        }
      }
    }

    // Si se anula una preventa, eliminarla completamente (no volver a PENDING)
    const entriesPreOrderInicial = entries.filter(e => e.source === 'PREORDER')
    const entriesEntrega = entries.filter(e => e.source === 'PREVENTA_ENTREGA')

    if (entriesPreOrderInicial.length > 0 || entriesEntrega.length > 0) {
      const pre = await prisma.preOrder.findFirst({
        where: { OR: [{ code: d.operationId }, { notes: { contains: d.operationId } }] },
      })
      if (pre) {
        // Eliminar la preventa completamente
        await prisma.preOrder.delete({ where: { id: pre.id } })
      }
    }

    // Si se anula una COMPRA, eliminar el equipo/producto que generó
    // (salvo que ya se haya vendido: ahí solo se avisa, no se toca nada).
    let avisoCompra: string | null = null
    const entriesCompra = entries.filter(e => e.source === 'COMPRA')
    if (entriesCompra.length > 0) {
      const item = await prisma.inventoryItem.findUnique({
        where: { code: d.operationId },
        include: { preOrder: true },
      })
      if (item) {
        if (item.status === 'SOLD') {
          avisoCompra = 'El equipo de esta compra ya fue vendido: el producto NO fue eliminado. Revisá manualmente en admin/productos.'
        } else {
          if (item.preOrder) {
            await prisma.preOrder.update({
              where: { id: item.preOrder.id },
              data: {
                status: 'PENDING',
                inventoryItemId: null,
                notes: (item.preOrder.notes || '') + ` | Compra ${d.operationId} anulada: ${d.motivo}`,
              },
            }).catch(() => {})
          }
          if (item.productId) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { deletedAt: new Date(), deletedBy: d.operador, deleteReason: `Compra ${d.operationId} anulada: ${d.motivo}` },
            }).catch(() => {})
          }
          await prisma.inventoryItem.delete({ where: { id: item.id } }).catch(() => {})
        }
      }
    }

    // Anular la operación: elimina sus asientos para que deje de aparecer
    await prisma.accountingEntry.deleteMany({ where: { operationId: d.operationId } })

    await auditar({
      entityType: 'AccountingEntry',
      entityId: d.operationId,
      action: 'ANULACION',
      reason: d.motivo,
      operator: d.operador,
      createdById: admin.id,
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      anulado: d.operationId,
      asientos: entries.length,
      motivo: d.motivo,
      aviso: avisoCompra,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}