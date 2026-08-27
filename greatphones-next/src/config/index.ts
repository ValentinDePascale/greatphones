/**
 * Centralized configuration for the Great Phones application.
 * All magic numbers, env vars, and cross-cutting constants live here.
 */

// ---- Application URL ----
export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ---- Allowed Origins (single source of truth) ----
// En desarrollo (sin NODE_ENV=production) aceptamos orígenes de túneles
// efímeros (trycloudflare.com, localtunnel, ngrok, serveo) y LAN para
// poder probar la app desde el celular. En producción, la lista es estricta:
// NEXTAUTH_URL + dominios conocidos + EXTRA vía env (ej: deploys de Render).
export const ALLOWED_ORIGINS_EXTRA = (process.env.ALLOWED_ORIGINS_EXTRA || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const ALLOWED_ORIGINS = [
  APP_URL,
  'https://greatphones.com.ar',
  'https://www.greatphones.com.ar',
  'https://greatphones.onrender.com',
  ...ALLOWED_ORIGINS_EXTRA,
]

// Patrones regex adicionales para dev (túneles HTTPS efímeros + LAN).
const DEV_TUNNEL_PATTERNS =
  process.env.NODE_ENV === 'production'
    ? []
    : [
        /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
        /^https:\/\/[a-z0-9-]+\.loca\.lt$/,
        /^https:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/,
        /^https:\/\/[a-z0-9-]+\.serveo\.net$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      ]

export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  for (const re of DEV_TUNNEL_PATTERNS) {
    if (re.test(origin)) return true
  }
  return false
}

// ---- Session ----
export const SESSION_COOKIE_NAME = 'gp-session'
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

// ---- Rate Limiting Windows ----
export const RATE_LIMIT = {
  checkout: { max: 10, windowMs: 5 * 60 * 1000 },
  signin: { max: 5, windowMs: 15 * 60 * 1000 },
  signup: { max: 3, windowMs: 60 * 60 * 1000 },
  forgotPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  resetPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  verifyCode: { max: 10, windowMs: 15 * 60 * 1000 },
  warrantyCheck: { max: 30, windowMs: 60 * 1000 },
  giftcardCheck: { max: 20, windowMs: 60 * 1000 },
  orderTrack: { max: 15, windowMs: 60 * 1000 },
  shipping: { max: 10, windowMs: 60 * 1000 },
  shippingAuth: { max: 20, windowMs: 60 * 1000 },
} as const

// ---- Reservation TTL ----
export const RESERVATION_TTL_MINUTES = 30

// ---- Warranty Costs ----
export const WARRANTY_COST_MAP: Record<string, number> = {
  '12 meses': 0,
  '+12 meses cobertura completa': 85000,
  '+24 meses': 150000,
}

// ---- Order State Machine ----
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

// ---- Prisma ----
export const PRISMA_POOL_MAX = 5

// ---- Cache ----
export const CACHE_MAX_ENTRIES = 50
export const CACHE_TTL_MS = 30_000

// ---- Env Var Validation ----
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'MP_ACCESS_TOKEN']

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error(`[Config] Missing required env vars: ${missing.join(', ')}`)
  }

  return { valid: missing.length === 0, missing }
}

// Run validation at import time
validateEnv()
