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

  const [row] = await prisma.$queryRaw<[{ unreadByUser: number; unreadByAdmin: number }]>`
    SELECT
      COALESCE(SUM(CASE WHEN "userId" = ${userId} THEN "unreadByUser" ELSE 0 END), 0)::int as "unreadByUser",
      COALESCE(SUM(CASE WHEN "adminId" = ${userId} THEN "unreadByAdmin" ELSE 0 END), 0)::int as "unreadByAdmin"
    FROM "Conversation"
    WHERE "userId" = ${userId} OR "adminId" = ${userId}
  `

  io.to(userId).emit('unreadUpdate', {
    unreadByUser: Number(row.unreadByUser) || 0,
    unreadByAdmin: Number(row.unreadByAdmin) || 0,
  })
}
