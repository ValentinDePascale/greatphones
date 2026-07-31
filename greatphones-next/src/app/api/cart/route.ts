import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, handleRouteError } from '@/lib/auth-guard'

// GET /api/cart — retrieve current user's persisted cart
export async function GET(request: Request) {
  try {
    const user = await requireSession(request)

    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, imageUrl: true, stock: true, isOffer: true, discount: true } },
            accessory: { select: { id: true, name: true, price: true, imageUrl: true, stock: true, isOffer: true, discount: true } },
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    const items = cart.items.map(item => {
      const source = item.product || item.accessory
      return {
        id: item.productId || item.accessoryId,
        name: source?.name || 'Producto no disponible',
        price: source?.price || 0,
        imageUrl: source?.imageUrl || null,
        stock: source?.stock || 0,
        isOffer: source?.isOffer || false,
        discount: source?.discount || 0,
        quantity: item.quantity,
        type: item.productId ? 'producto' : 'accesorio',
      }
    })

    return NextResponse.json({ items, updatedAt: cart.updatedAt })
  } catch (error) {
    return handleRouteError(error)
  }
}

// POST /api/cart — sync full cart from client
export async function POST(request: Request) {
  try {
    const user = await requireSession(request)
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items debe ser un array' }, { status: 400 })
    }

    // Replace entire cart atomically
    const cart = await prisma.$transaction(async (tx) => {
      const existing = await tx.cart.findUnique({ where: { userId: user.id } })
      if (existing) {
        await tx.cartItem.deleteMany({ where: { cartId: existing.id } })
        await tx.cart.delete({ where: { id: existing.id } })
      }

      return tx.cart.create({
        data: {
          userId: user.id,
          items: {
            create: items.map((item: { id: string; quantity: number; type?: string }) => ({
              productId: item.type !== 'accesorio' ? item.id : null,
              accessoryId: item.type === 'accesorio' ? item.id : null,
              quantity: Math.max(1, item.quantity || 1),
            }))
          }
        }
      })
    })

    return NextResponse.json({ success: true, itemCount: items.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
