import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: Request) {
  const indexPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(indexPath)
    ? readFileSync(indexPath, 'utf-8')
    : null

  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/+/, '')

  if (!html) {
    return NextResponse.json({ error: 'Not found', path }, { status: 404 })
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}