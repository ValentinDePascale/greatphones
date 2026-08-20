import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit') ?? DEFAULT_LIMIT)))

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, name: true, email: true, role: true,
          createdAt: true, phone: true, direccion: true,
        },
      }),
      prisma.user.count(),
    ])
    return NextResponse.json({ users, total, page, limit })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { id, role } = body

    if (!id || !role) {
      return NextResponse.json({ error: 'id y role son requeridos' }, { status: 400 })
    }

    if (!['ADMIN', 'CLIENT'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as 'ADMIN' | 'CLIENT' },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    // Soportar id único (legacy) o varios ids (multiselección): "ids=a,b,c" o "id=x"
    const rawIds = searchParams.get('ids')
    const singleId = searchParams.get('id')
    const ids = rawIds ? rawIds.split(',').map(s => s.trim()).filter(Boolean) : (singleId ? [singleId] : [])

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Falta un id de usuario' }, { status: 400 })
    }

    const count = await prisma.user.count()
    const lastUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    const adminIds = new Set(lastUsers.map(u => u.id))
    // No permitir eliminar el último admin ni a sí mismo
    for (const id of ids) {
      if (adminIds.has(id)) {
        return NextResponse.json({ error: 'No se puede eliminar un usuario administrador' }, { status: 400 })
      }
    }

    // Delete en cascada (transacción): borra los registros dependientes del usuario
    // antes de eliminar el User, evitando violaciones de clave foránea (P2003).
    await prisma.$transaction(async tx => {
      for (const id of ids) {
        // Mensajes y conversaciones del usuario
        const convs = await tx.conversation.findMany({ where: { userId: id }, select: { id: true } })
        const convIds = convs.map(c => c.id)
        if (convIds.length) {
          await tx.message.deleteMany({ where: { conversationId: { in: convIds } } })
          await tx.conversation.deleteMany({ where: { id: { in: convIds } } })
        }
        await tx.message.deleteMany({ where: { fromUserId: id } })

        // Datos de la wallet
        const wallets = await tx.wallet.findMany({ where: { userId: id }, select: { id: true } })
        const walletIds = wallets.map(w => w.id)
        if (walletIds.length) {
          await tx.walletTransaction.deleteMany({ where: { walletId: { in: walletIds } } })
          await tx.wallet.deleteMany({ where: { id: { in: walletIds } } })
        }

        // Resto de dependencias que se vinculan por userId
        await tx.favorite.deleteMany({ where: { userId: id } })
        await tx.notification.deleteMany({ where: { userId: id } })
        await tx.cartItem.deleteMany({ where: { cart: { userId: id } } })
        await tx.cart.deleteMany({ where: { userId: id } })
        await tx.quote.deleteMany({ where: { userId: id } })
        await tx.repair.deleteMany({ where: { userId: id } })
        await tx.arrepentimiento.deleteMany({ where: { userId: id } })
        await tx.preOrder.deleteMany({ where: { createdById: id } })
        await tx.coupon.deleteMany({ where: { userId: id } })
        await tx.session.deleteMany({ where: { userId: id } })
        await tx.account.deleteMany({ where: { userId: id } })

        await tx.user.delete({ where: { id } })
      }
    })

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error: any) {
    // Si es una violación de FK que nos quedó sin cubrir, devolvemos mensaje claro
    if (error?.code === 'P2003') {
      console.error('Delete user FK violation:', error)
      return NextResponse.json(
        { error: 'No se pudo eliminar: el usuario tiene registros asociados (pedidos, ventas u otros). Revisá los datos vinculados.' },
        { status: 409 },
      )
    }
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
