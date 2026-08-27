import { isOriginAllowed } from '@/config'

function originFromReferer(referer: string): string | null {
  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

export function isMutatingRequest(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

/**
 * Rutas exentas de CSRF porque validan autenticidad por firma/secret en lugar de Origin
 * (ej: webhooks de MercadoPago, Arca).
 */
const CSRF_EXEMPT_PATHS = ['/api/webhooks/mercadopago', '/api/webhooks/arca']

export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(p => pathname.startsWith(p))
}

/**
 * Bypass explícito de CSRF. Solo se activa cuando se setea la variable
 * de entorno `BYPASS_CSRF=true`. En producción esto NUNCA se activa.
 *
 * NOTA: NO se activa automáticamente en `NODE_ENV=test` para que los tests
 * unitarios de este módulo prueben la lógica real.
 */
function isCsrfBypassed(): boolean {
  return process.env.BYPASS_CSRF === 'true'
}

export function isAllowedRequestOrigin(request: {
  headers: Headers
  nextUrl?: { pathname?: string }
}): boolean {
  // Bypass explícito (solo con env var)
  if (isCsrfBypassed()) return true

  const pathname = request.nextUrl?.pathname ?? ''
  if (pathname && isCsrfExempt(pathname)) return true

  const origin = request.headers.get('origin')
  if (origin) {
    // Same-origin: si el origen coincide con el host con el que se sirve la app
    // (https://<host> o http://<host>), se acepta directo. Esto cubre cualquier dominio de
    // deploy (Render, Vercel, etc.) sin depender de la lista de config y permite
    // localhost y LAN http sin depender de NEXTAUTH_URL.
    const host = request.headers.get('host')
    if (host && (origin === 'https://' + host || origin === 'http://' + host)) return true
    return isOriginAllowed(origin)
  }

  // Para mutaciones sin Origin exigimos Referer como respaldo.
  // Lecturas (GET/HEAD) sin Origin se permiten (cURL, link previews, etc).
  if (!isMutatingRequest(request.headers.get('x-http-method-override') ?? 'GET')) return true

  const referer = request.headers.get('referer')
  if (!referer) return false

  const refererOrigin = originFromReferer(referer)
  return refererOrigin ? isOriginAllowed(refererOrigin) : false
}
