import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const [equipos, accesorios] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, isPreorder: false, stock: { gt: 0 } },
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          brand: true,
          storage: true,
          color: true,
          cost: true,
          price: true,
          stock: true,
          condition: true,
        },
      }),
      prisma.accessory.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
    ])

    const equiposOut = equipos.map(e => ({
      id: e.id,
      modelo: e.name + (e.storage ? ' ' + e.storage : ''),
      marca: e.brand || '—',
      color: e.color || '—',
      stock: e.stock || 0,
      costo: e.cost || 0,
      precioVenta: e.price || 0,
      condicion: e.condition || '—',
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