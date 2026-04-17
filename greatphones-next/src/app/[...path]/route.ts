import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join, extname, dirname } from 'path'

const contentTypes: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.txt': 'text/plain',
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  let path = url.pathname.replace(/^\/+/, '')
  
  if (path === '' || path === 'index.html') {
    path = 'index.html'
  }
  
  const publicDir = join(process.cwd(), 'public')
  const filePath = join(publicDir, path)
  
  if (existsSync(filePath)) {
    const ext = extname(filePath)
    const contentType = contentTypes[ext] || 'application/octet-stream'
    const file = readFileSync(filePath)
    return new NextResponse(file, { headers: { 'Content-Type': contentType } })
  }
  
  return NextResponse.json({ error: 'Not found', path, cwd: process.cwd() }, { status: 404 })
}