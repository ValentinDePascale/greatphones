import type { Server as SocketServer } from 'socket.io'

const globalForIO = globalThis as unknown as {
  io: SocketServer | undefined
}

export function getIO(): SocketServer | null {
  return globalForIO.io ?? null
}

export function setIO(io: SocketServer): void {
  globalForIO.io = io
}

export async function emitUnreadUpdate(userId: string): Promise<void> {
  const io = getIO()
  if (!io) return

  const { prisma } = await import('@/lib/prisma')

  const [asUser, asAdmin] = await Promise.all([
    prisma.conversation.aggregate({
      where: { userId },
      _sum: { unreadByUser: true },
    }),
    prisma.conversation.aggregate({
      where: { adminId: userId },
      _sum: { unreadByAdmin: true },
    }),
  ])

  io.to(userId).emit('unreadUpdate', {
    unreadByUser: asUser._sum.unreadByUser || 0,
    unreadByAdmin: asAdmin._sum.unreadByAdmin || 0,
  })
}
