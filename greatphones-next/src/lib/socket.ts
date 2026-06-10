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
