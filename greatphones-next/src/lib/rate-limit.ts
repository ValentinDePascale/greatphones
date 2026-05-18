const store = new Map<string, { count: number; resetTime: number }>()

const CLEANUP_INTERVAL = 60000

function cleanup() {
  const now = Date.now()
  for (const [key, val] of store) {
    if (val.resetTime < now) store.delete(key)
  }
}

setInterval(cleanup, CLEANUP_INTERVAL)

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetTime < now) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetTime }
}

export function getRateLimitInfo(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetTime < now) {
    return { count: 0, remaining: max, resetAt: now + windowMs }
  }
  return { count: entry.count, remaining: Math.max(0, max - entry.count), resetAt: entry.resetTime }
}
