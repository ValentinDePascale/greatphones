import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { productCache } from '@/lib/cache'

interface PreventaItem {
  modelo: string
  almacenamiento: string
  imageUrl?: string
  brand?: string
  color: string
  precio: number
  fecha: string
}

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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

    const productosCreados: string[] = []

    for (const item of preventas as PreventaItem[]) {
      try {
        if (!item.modelo || !item.color || !item.precio || !item.fecha) {
          console.warn('Preventa incompleta, se omite:', item)
          continue
        }

        const modelGroup = `pre-${slugify(item.modelo)}-${slugify(item.almacenamiento || '')}`

        // Si ya existe una variante de este color para este dispositivo,
        // actualizarla en lugar de duplicarla.
        const existente = await prisma.product.findFirst({
          where: {
            modelGroup,
            color: item.color,
            isPreorder: true,
            deletedAt: null,
          },
        })

        if (existente) {
          const actualizado = await prisma.product.update({
            where: { id: existente.id },
            data: {
              price: item.precio,
              availableFrom: new Date(item.fecha),
              imageUrl: item.imageUrl || existente.imageUrl,
            },
          })
          productosCreados.push(actualizado.id)
          continue
        }

        const producto = await prisma.product.create({
          data: {
            name: item.modelo,
            ico: '📱',
            imageUrl: item.imageUrl || null,
            images: [],
            brand: item.brand || 'Otro',
            sub: item.almacenamiento || null,
            condition: 'Nuevo',
            price: item.precio,
            cost: 0,
            stock: 0,
            type: 'celular',
            color: item.color,
            modelGroup,
            isPreorder: true,
            availableFrom: new Date(item.fecha),
          },
        })

        productosCreados.push(producto.id)
      } catch (err) {
        console.error(`Error creando preventa: ${item.modelo} - ${item.color}`, err)
      }
    }

    productCache.clear()

    return NextResponse.json({
      success: true,
      productosCreados,
      total: productosCreados.length,
      message: `${productosCreados.length} color${productosCreados.length !== 1 ? 'es' : ''} de preventa publicado${productosCreados.length !== 1 ? 's' : ''} en el catálogo`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
