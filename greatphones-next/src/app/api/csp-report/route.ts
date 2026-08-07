import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const report = body?.['csp-report']
    if (report) {
      // Suppress dev-mode eval noise (React hot reload)
      const blocked = report['blocked-uri']
      const source = report['source-file'] || ''
      if (blocked !== 'eval' && !source.includes('react-server-dom')) {
        console.warn('[CSP] Violation:', report['violated-directive'], report['blocked-uri'])
      }
    }
  } catch {
    // Silently ignore malformed reports
  }
  return new NextResponse(null, { status: 204 })
}
