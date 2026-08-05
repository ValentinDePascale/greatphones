import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const report = body?.['csp-report']
    if (report) {
      console.warn('[CSP] Violation report:', JSON.stringify(report))
    }
  } catch {
    // Silently ignore malformed reports
  }
  return NextResponse.json({}, { status: 204 })
}
