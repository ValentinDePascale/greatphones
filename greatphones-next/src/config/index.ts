/**
 * Centralized configuration for the Great Phones application.
 * All magic numbers, env vars, and cross-cutting constants live here.
 */

// ---- Application URL ----
export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ---- Allowed Origins (single source of truth) ----
export const ALLOWED_ORIGINS = [
  APP_URL,
  'https://greatphones.com.ar',
  'https://www.greatphones.com.ar',
  'https://greatphones.onrender.com',
]

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
  '90 días': 0,
  '+12 meses': 85000,
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
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'MP_ACCESS_TOKEN',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error(`[Config] Missing required env vars: ${missing.join(', ')}`)
  }

  return { valid: missing.length === 0, missing }
}

// Run validation at import time
validateEnv()
