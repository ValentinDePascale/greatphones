import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'



export async function GET(request: Request) {
  try {
    const user = await requireSession(request)
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')

    // Only admins can view other users' favorites
    const userId = (queryUserId && user.role === 'ADMIN') ? queryUserId : user.id
    
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            sub: true,
            price: true,
            stock: true,
            imageUrl: true,
            ico: true,
            isOffer: true,
            discount: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(favorites.map(f => f.product))
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession(request)
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 })
    }

    const favorite = await prisma.favorite.create({
      data: { userId: user.id, productId }
    })

    return NextResponse.json({ success: true, favorite })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya esta en favoritos' }, { status: 400 })
    }
    console.error('Favorites POST error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireSession(request)
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId requerido' }, { status: 400 })
    }

    await prisma.favorite.deleteMany({
      where: { userId: user.id, productId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorites DELETE error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
