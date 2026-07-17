import { prisma } from './prisma'

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const expiresAt = new Date(now + windowMs)

  const result = await prisma.$queryRawUnsafe<
    Array<{ count: bigint; resetAt: Date }>
  >(
    `INSERT INTO "RateLimit" (key, count, "expiresAt", "createdAt", "updatedAt")
     VALUES ($1, 1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
       "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN $2 ELSE "RateLimit"."expiresAt" END,
       "updatedAt" = NOW()
     RETURNING count, "expiresAt" AS "resetAt"`,
    key,
    expiresAt
  )

  const row = result?.[0]
  if (!row) {
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  const count = Number(row.count)
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetAt: row.resetAt.getTime(),
  }
}

export async function getRateLimitInfo(
  key: string,
  max: number,
  windowMs: number
): Promise<{ count: number; remaining: number; resetAt: number }> {
  const now = Date.now()
  const nowDate = new Date(now)

  const result = await prisma.$queryRawUnsafe<
    Array<{ count: bigint; expiresAt: Date }>
  >(
    `SELECT count, "expiresAt" FROM "RateLimit" WHERE key = $1`,
    key
  )

  const row = result?.[0]
  if (!row || row.expiresAt < nowDate) {
    return { count: 0, remaining: max, resetAt: now + windowMs }
  }

  const count = Number(row.count)
  return {
    count,
    remaining: Math.max(0, max - count),
    resetAt: row.expiresAt.getTime(),
  }
}
