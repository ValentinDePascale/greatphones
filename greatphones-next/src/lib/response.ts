import { NextResponse } from 'next/server'

export function apiResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const body: any = { data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

export function apiError(error: string, status = 500, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status })
}

export function apiSuccess(message: string, data?: unknown, status = 200) {
  return NextResponse.json({ success: true, message, ...(data ? { data } : {}) }, { status })
}
