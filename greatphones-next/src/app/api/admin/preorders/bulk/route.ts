import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'

interface PreOrderBulkItem {
  productId?: string
  productColor?: string
  customPrice: number
  expectedDeliveryEnd: string
}

async function generatePreOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Verificar que sea único
  const existing = await prisma.preOrder.findUnique({
    where: { code: `PRE-${code}` },
  })
  if (existing) return generatePreOrderCode() // Recursión para reintentar
  return `PRE-${code}`
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

    const codigos: string[] = []
    const creadas: any[] = []

    for (const item of preventas) {
      const code = await generatePreOrderCode()

      try {
        // Usar transacción para asegurar consistencia
        const { preorder } = await prisma.$transaction(async (tx) => {
          // Obtener producto para copiar datos
          const producto = item.productId ? await tx.product.findUnique({
            where: { id: item.productId },
          }) : null

          // Crear producto de preventa si el producto original existe
          let productoPreventId: string | undefined = undefined
          if (producto) {
            const productoPrevent = await tx.product.create({
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
            productoPreventId = productoPrevent.id
          }

          const preorder = await tx.preOrder.create({
            data: {
              code,
              status: 'PENDING',
              source: 'online',
              clientName: 'Online',
              productId: productoPreventId,
              productColor: item.productColor || undefined,
              customPrice: item.customPrice || 0,
              expectedDeliveryEnd: item.expectedDeliveryEnd
                ? new Date(item.expectedDeliveryEnd)
                : undefined,
            },
          })

          return { preorder }
        })

        codigos.push(code)
        creadas.push(preorder)

        // Registrar asiento contable para INGRESO
        if (item.customPrice > 0) {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/accounting/entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'PREVENTA',
              type: 'INGRESO',
              means: 'PREVENTA',
              amount: item.customPrice,
              amountUsd: null,
              operationId: code,
              description: `Preventa ${item.productColor || 'estándar'}`,
              category: 'SALES',
            }),
          }).catch(() => {})
        }
      } catch (err) {
        console.error(`Error creando preventa: ${code}`, err)
      }
    }

    return NextResponse.json({
      success: true,
      codigos,
      total: codigos.length,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
