import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { productCache } from '@/lib/cache'

interface PreventaOnlineItem {
  productId: string
  productColor: string
  customPrice: number
  expectedDeliveryEnd: string
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)

    const { preventas } = await request.json()

    if (!Array.isArray(preventas) || preventas.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de preventas' },
        { status: 400 },
      )
    }

    if (preventas.length > 100) {
      return NextResponse.json(
        { error: 'Máximo 100 preventas por solicitud' },
        { status: 400 },
      )
    }

    const productosCreados: any[] = []

    for (const item of preventas) {
      try {
        // Obtener producto original para copiar datos
        const producto = await prisma.product.findUnique({
          where: { id: item.productId },
        })

        if (!producto) {
          console.warn(`Producto no encontrado: ${item.productId}`)
          continue
        }

        // Crear producto de preventa (sin crear PreOrder)
        const productoPrevent = await prisma.product.create({
          data: {
            name: `${producto.name} - ${item.productColor}`,
            ico: producto.ico,
            imageUrl: producto.imageUrl,
            images: producto.images,
            brand: producto.brand,
            sub: producto.sub,
            condition: producto.condition,
            price: item.customPrice,
            cost: 0,
            stock: 0,
            type: producto.type,
            isPreorder: true,
            availableFrom: item.expectedDeliveryEnd
              ? new Date(item.expectedDeliveryEnd)
              : undefined,
          },
        })

        productosCreados.push(productoPrevent.id)
      } catch (err) {
        console.error(`Error creando preventa online:`, err)
      }
    }

    // Limpiar cache de productos
    productCache.clear()

    return NextResponse.json({
      success: true,
      productosCreados,
      total: productosCreados.length,
      message: `${productosCreados.length} producto${productosCreados.length !== 1 ? 's' : ''} de preventa agregado${productosCreados.length !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
