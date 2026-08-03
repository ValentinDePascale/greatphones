import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined
}

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    const useTls = url.startsWith('rediss://')
    const redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 500, 3000)
      },
      connectTimeout: 10000,
      enableOfflineQueue: false,
      tls: useTls ? {} : undefined,
      lazyConnect: true,
    })

    redis.on('error', () => { /** noop — errors suppressed, fallback handles it */ })

    redis.connect()
      .then(() => {
        console.log('[Redis] Connected successfully')
      })
      .catch(() => {
        globalForRedis.redis = null
        redis.disconnect()
      })

    return redis
  } catch {
    return null
  }
}

export function getRedis(): Redis | null {
  if (globalForRedis.redis === undefined) {
    globalForRedis.redis = createRedis()
  }
  if (globalForRedis.redis && globalForRedis.redis.status !== 'ready') {
    return null
  }
  return globalForRedis.redis
}

export const PRESENCE_TTL = 60
export const TYPING_TTL = 5

export async function setPresence(userId: string, socketId: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.set(`presence:${userId}`, socketId, 'EX', PRESENCE_TTL).catch(() => {})
  }
}

export async function getPresence(userId: string): Promise<string | null> {
  const redis = getRedis()
  if (redis) {
    try { return await redis.get(`presence:${userId}`) } catch { return null }
  }
  return null
}

export async function delPresence(userId: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.del(`presence:${userId}`).catch(() => {})
  }
}

export async function setTyping(convId: string, userId: string, userName: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.set(`typing:${convId}:${userId}`, userName, 'EX', TYPING_TTL).catch(() => {})
  }
}

export async function delTyping(convId: string, userId: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.del(`typing:${convId}:${userId}`).catch(() => {})
  }
}

export async function getTypingUsers(convId: string): Promise<Map<string, string>> {
  const redis = getRedis()
  if (redis) {
    try {
      const keys = await redis.keys(`typing:${convId}:*`)
      const result = new Map<string, string>()
      for (const key of keys) {
        const userId = key.split(':').pop()!
        const name = (await redis.get(key)) || 'Alguien'
        result.set(userId, name)
      }
      return result
    } catch { return new Map() }
  }
  return new Map()
}
