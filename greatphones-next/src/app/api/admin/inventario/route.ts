import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const [equipos, accesorios] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { status: { notIn: ['SOLD', 'RESERVED'] } },
        orderBy: [{ modelName: 'asc' }, { purchaseDate: 'desc' }],
        select: {
          code: true, imei: true, modelName: true, storage: true, color: true,
          purchasePrice: true, salePrice: true, status: true, deviceType: true,
        },
      }),
      prisma.accessory.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
    ])

    const equiposOut = equipos.map(e => ({
      modelo: e.modelName + (e.storage ? ' ' + e.storage : ''),
      imei: e.imei,
      color: e.color || '—',
      costo: e.purchasePrice,
      precioVenta: e.salePrice || 0,
      estado: mapInventoryStatus(e.status),
    }))

    const accesoriosOut = accesorios.map(a => {
      const stock = a.stock
      const valorStock = stock * (a.cost || 0)
      const estado = stock <= 0 ? 'Sin stock' : stock <= 5 ? 'Bajo stock' : 'Disponible'
      return {
        id: a.id,
        categoria: a.category || '—',
        producto: a.name,
        marca: a.brand || '—',
        color: a.color || '—',
        stock,
        costo: a.cost || 0,
        precioVenta: a.price || 0,
        valorStock,
        ubicacion: a.modelGroup || '—',
        estado,
      }
    })

    return NextResponse.json({ equipos: equiposOut, accesorios: accesoriosOut })
  } catch (error) {
    return handleRouteError(error)
  }
}

function mapInventoryStatus(s: string) {
  switch (s) {
    case 'IN_STOCK': return 'En stock'
    case 'SOLD': return 'Vendido'
    case 'RESERVED': return 'Reservado'
    case 'REPAIR': return 'En reparación'
    case 'IN_TRANSIT': return 'En tránsito'
    default: return s.replace(/_/g, ' ')
  }
}