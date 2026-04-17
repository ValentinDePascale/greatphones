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

function findProjectRoot(cwd: string): string {
  if (existsSync(join(cwd, 'app.html'))) return cwd
  const parent = dirname(cwd)
  if (existsSync(join(parent, 'app.html'))) return parent
  const grandparent = dirname(parent)
  if (existsSync(join(grandparent, 'app.html'))) return grandparent
  return cwd
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  let path = url.pathname.replace(/^\/+/, '')
  
  const projectRoot = findProjectRoot(process.cwd())

  if (path === '' || path === 'index.html') {
    const htmlPath = join(projectRoot, 'app.html')
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf-8')
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
    }
    return NextResponse.json({ error: 'HTML not found', projectRoot, cwd: process.cwd() }, { status: 404 })
  }
  
  if (path.startsWith('lib/') || path.startsWith('styles/')) {
    const filePath = join(projectRoot, path)
    if (existsSync(filePath)) {
      const ext = extname(filePath)
      const contentType = contentTypes[ext] || 'application/octet-stream'
      const file = readFileSync(filePath)
      return new NextResponse(file, { headers: { 'Content-Type': contentType } })
    }
  }
  
  return NextResponse.json({ error: 'Not found', path, projectRoot, cwd: process.cwd() }, { status: 404 })
}