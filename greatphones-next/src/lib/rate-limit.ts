import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const expiresAt = new Date(now + windowMs)

  const result = await prisma.$queryRaw<
    Array<{ count: bigint; resetAt: Date }>
  >(
    Prisma.sql`
      INSERT INTO "RateLimit" (key, count, "expiresAt", "createdAt", "updatedAt")
      VALUES (${key}, 1, ${expiresAt}, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN ${expiresAt} ELSE "RateLimit"."expiresAt" END,
        "updatedAt" = NOW()
      RETURNING count, "expiresAt" AS "resetAt"
    `
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

  const result = await prisma.$queryRaw<
    Array<{ count: bigint; expiresAt: Date }>
  >(
    Prisma.sql`
      SELECT count, "expiresAt" FROM "RateLimit" WHERE key = ${key}
    `
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
