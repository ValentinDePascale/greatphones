import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const paths = [
    join(process.cwd(), 'public', 'index.html'),
    join(process.cwd(), '..', 'public', 'index.html'),
  ]
  
  for (const p of paths) {
    if (existsSync(p)) {
      const html = readFileSync(p, 'utf-8')
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  }
  
  return new NextResponse('Not found', { status: 404 })
}