import crypto from 'crypto'

const COOKIE_NAME = 'gp-session'
const MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

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

  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

export function getSessionFromCookies(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (!sessionCookie) return null

  const token = sessionCookie.slice(COOKIE_NAME.length + 1)
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, providedSig] = parts

  const expectedSig = sign(encoded)
  const providedBuf = Buffer.from(providedSig)
  const expectedBuf = Buffer.from(expectedSig)
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    if (!payload.id || !payload.role) return null
    return { id: payload.id, role: payload.role }
  } catch {
    return null
  }
}
