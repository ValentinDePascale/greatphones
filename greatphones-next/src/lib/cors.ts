import { isOriginAllowed } from '@/config'

export function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : null

  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function corsOptions(origin?: string | null) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}
