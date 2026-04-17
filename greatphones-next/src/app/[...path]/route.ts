import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join, extname } from 'path'

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  let path = url.pathname
  
  if (path === '/') {
    const htmlPath = join(process.cwd(), '..', 'app.html')
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf-8')
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }
    return NextResponse.json({ error: 'HTML not found' }, { status: 404 })
  }
  
  if (path.startsWith('/lib/') || path.startsWith('/styles/')) {
    const filePath = join(process.cwd(), '..', path)
    if (existsSync(filePath)) {
      const ext = extname(filePath)
      const contentType = contentTypes[ext] || 'application/octet-stream'
      const file = readFileSync(filePath)
      return new NextResponse(file, {
        headers: { 'Content-Type': contentType },
      })
    }
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}