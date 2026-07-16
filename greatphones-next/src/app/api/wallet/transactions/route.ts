import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    })
    if (!user?.wallet) {
      return NextResponse.json({ transactions: [], total: 0, page, totalPages: 0 })
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: user.wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({
        where: { walletId: user.wallet.id }
      })
    ])

    return NextResponse.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        referenceId: tx.referenceId,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[Wallet Transactions] Error:', error)
    return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 })
  }
}
