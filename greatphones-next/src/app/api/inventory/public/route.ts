import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIpKey } from '@/lib/rate-limit'

/**
 * Endpoint PÚBLICO de variantes de inventario.
 *
 * Solo expone información segura para clientes:
 * - id, code, status, targetPrice
 * - storage, color, cosmeticCondition, batteryHealth
 * - imageUrl
 *
 * NO expone (datos sensibles):
 * - imei, serialNumber
 * - purchasePrice, purchaseDate
 * - supplierId, investor, soldById, createdById, notes
 *
 * Usado por la página de detalle de producto para mostrar
 * variantes disponibles (storage/color/precio) sin filtrar IMEI.
 */
export async function GET(request: Request) {
  try {
    const ip = clientIpKey(request)
    const rl = await rateLimit(`inventory-public:${ip}`, 60, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 })
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        productId,
        status: { not: 'SOLD' },
      },
      select: {
        id: true,
        code: true,
        status: true,
        targetPrice: true,
        salePrice: true,
        storage: true,
        color: true,
        cosmeticCondition: true,
        batteryHealth: true,
        imageUrl: true,
        productId: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json(
      { data: items },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[inventory/public] Error:', error)
    return NextResponse.json({ error: 'Error al cargar variantes' }, { status: 500 })
  }
}
