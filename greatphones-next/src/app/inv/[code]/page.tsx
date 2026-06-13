import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import InventoryFichaClient from './InventoryFichaClient'

export const dynamic = 'force-dynamic'

export default async function InvPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/?next=/inv/${code}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { role: true }
  })
  if (user?.role !== 'ADMIN') {
    redirect(`/?error=admin-only`)
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { code },
    include: {
      product: { select: { id: true, name: true, price: true, stock: true } },
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      soldBy: { select: { id: true, name: true } },
      history: { orderBy: { createdAt: 'desc' }, take: 50 },
    }
  })

  return <InventoryFichaClient item={item} session={session} />
}
