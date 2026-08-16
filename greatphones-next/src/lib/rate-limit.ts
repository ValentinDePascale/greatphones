import crypto from 'crypto'
import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Regex permisivo: acepta IPv4 (con .), IPv6 (con :), letras, dígitos, _, -.
// Anteriormente solo aceptaba [a-zA-Z0-9:_-] lo cual rompia con IPv4 (127.0.0.1)
// e IPv4-mapeada-IPv6 (::ffff:127.0.0.1) que tienen puntos.
const KEY_REGEX = /^[a-zA-Z0-9:._-]{1,128}$/

/**
 * Convierte un identificador arbitrario (email, teléfono, etc.) en una parte
 * de key segura para rate-limit. Si el valor ya es alfanumérico seguro,
 * lo usa tal cual (útil para debugging). Si contiene caracteres especiales
 * (email, teléfono con +, etc.), lo hashea con SHA-256 truncado.
 *
 * Esto evita errores de "Invalid rate-limit key" cuando se usan emails
 * y además no expone PII en logs de Redis.
 */
export function safeKeyPart(value: string | null | undefined): string {
  if (!value) return 'anon'
  if (KEY_REGEX.test(value)) return value
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex').slice(0, 32)
}

/**
 * Normaliza la IP de un cliente extraída de headers x-forwarded-for / x-real-ip
 * a un formato seguro para usar en keys de rate-limit.
 *
 * - Toma el primer hop de x-forwarded-for (cliente real, no proxy intermedio)
 * - Convierte IPv4-mapeada-IPv6 (::ffff:127.0.0.1) a IPv4 puro (127.0.0.1)
 * - Fallback a 'unknown' si no hay headers
 *
 * Uso: `const ip = clientIpKey(request)`
 */
export function clientIpKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const raw = forwarded?.split(',')[0]?.trim() || real || 'unknown'
  // IPv4-mapeada-IPv6: ::ffff:127.0.0.1 -> 127.0.0.1
  const ipv4 = raw.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/i)?.[1]
  return ipv4 || raw
}

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!KEY_REGEX.test(key)) {
    throw new Error(`Invalid rate-limit key: must match ${KEY_REGEX}`)
  }
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
