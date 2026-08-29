import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { productCache } from '@/lib/cache'

interface PreventaVariante {
  color: string
  precio: number
  fecha: string
}

interface PreventaAgrupada {
  modelo: string
  almacenamiento: string
  imageUrl?: string
  brand?: string
  variantes: PreventaVariante[]
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

    // Agrupar preventas por modelo + almacenamiento
    const grouped = new Map<string, PreventaAgrupada>()

    preventas.forEach((item: any) => {
      const key = `${item.modelo}|${item.almacenamiento}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          modelo: item.modelo,
          almacenamiento: item.almacenamiento,
          imageUrl: item.imageUrl,
          brand: item.brand,
          variantes: [],
        })
      }
      grouped.get(key)!.variantes.push({
        color: item.color,
        precio: item.precio,
        fecha: item.fecha,
      })
    })

    const productosCreados: any[] = []

    // Crear un producto por agrupación (modelo + almacenamiento)
    for (const [_, preventa] of grouped) {
      try {
        const productoPrevent = await prisma.product.create({
          data: {
            name: preventa.modelo,
            ico: '📱',
            imageUrl: preventa.imageUrl || null,
            brand: preventa.brand || 'Genérico',
            sub: preventa.almacenamiento,
            condition: 'Nuevo',
            price: preventa.variantes[0]?.precio || 0,
            cost: 0,
            stock: 0,
            type: 'celular',
            isPreorder: true,
            availableFrom: preventa.variantes[0]?.fecha
              ? new Date(preventa.variantes[0].fecha)
              : undefined,
            // Guardar variantes como JSON para mostrar en catálogo
            images: preventa.variantes.map((v: PreventaVariante) => ({
              color: v.color,
              precio: v.precio,
              disponibleEn: v.fecha,
            })),
          },
        })

        productosCreados.push(productoPrevent.id)
      } catch (err) {
        console.error(`Error creando preventa: ${preventa.modelo}`, err)
      }
    }

    productCache.clear()

    return NextResponse.json({
      success: true,
      productosCreados,
      total: productosCreados.length,
      message: `${productosCreados.length} producto${productosCreados.length !== 1 ? 's' : ''} de preventa agregado${productosCreados.length !== 1 ? 's' : ''} al catálogo`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
