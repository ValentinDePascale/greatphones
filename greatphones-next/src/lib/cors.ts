import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://greatphones.onrender.com',
  'https://greatphones.com.ar',
]

export function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {}
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  return headers
}

export function corsResponse(data: unknown, status = 200, origin: string | null = null) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(origin)
  })
}
