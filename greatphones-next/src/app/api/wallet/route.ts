import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    let wallet = user.wallet
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id }
      })
    }

    return NextResponse.json({
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
    })
  } catch (error) {
    console.error('[Wallet] Error:', error)
    return NextResponse.json({ error: 'Error al obtener wallet' }, { status: 500 })
  }
}
