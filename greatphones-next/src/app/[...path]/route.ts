import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const indexPath = join(process.cwd(), 'public', 'index.html')
const cachedIndexHtml = existsSync(indexPath)
  ? readFileSync(indexPath, 'utf-8')
  : null

export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/+/, '')

  if (!cachedIndexHtml) {
    return NextResponse.json({ error: 'Not found', path }, { status: 404 })
  }

  return new NextResponse(cachedIndexHtml, {
    headers: { 'Content-Type': 'text/html' }
  })
}