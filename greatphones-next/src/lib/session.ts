import crypto from 'crypto'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/config'

const COOKIE_NAME = SESSION_COOKIE_NAME
const MAX_AGE = SESSION_MAX_AGE_SECONDS

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for session tokens')
  return secret
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(payload)
  return hmac.digest('base64url')
}

export interface SessionPayload {
  id: string
  role: string
}

export function createSessionCookie(userId: string, role: string): string {
  const payload: SessionPayload & { exp: number } = {
    id: userId,
    role,
    exp: Date.now() + MAX_AGE * 1000,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encoded)
  const token = `${encoded}.${signature}`
  const isSecure =
    process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://')
  const secure = isSecure ? '; Secure' : ''

  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
}

export function clearSessionCookie(): string {
  const isSecure =
    process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://')
  const secure = isSecure ? '; Secure' : ''
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, providedSig] = parts

  const expectedSig = sign(encoded)
  const providedBuf = Buffer.from(providedSig)
  const expectedBuf = Buffer.from(expectedSig)
  // Las firmas deben tener el mismo largo para timingSafeEqual; si difieren,
  // el token es inválido (evita comparar buffers de distinto tamaño).
  if (providedBuf.length !== expectedBuf.length) return null
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    if (!payload.id || !payload.role) return null
    return { id: payload.id, role: payload.role }
  } catch {
    // Invalid token format — return null (no session)
    return null
  }
}

export function getSessionFromCookies(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (!sessionCookie) return null

  const token = sessionCookie.slice(COOKIE_NAME.length + 1)
  return verifySessionToken(token)
}
