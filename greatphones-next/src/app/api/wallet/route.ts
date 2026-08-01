import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, handleRouteError } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    const user = await requireSession(request)

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id }
      })
    }

    return NextResponse.json({
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      id: wallet.id,
      userId: wallet.userId,
      version: wallet.version,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
