import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const startTime = Date.now()

export async function GET() {
  let dbStatus: 'ok' | 'error' = 'error'
  let dbLatency = 0

  try {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - t0
    dbStatus = 'ok'
  } catch { console.error('[Health] Database unreachable'); }

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
    },
    timestamp: new Date().toISOString(),
  }, {
    status: dbStatus === 'ok' ? 200 : 503,
  })
}
