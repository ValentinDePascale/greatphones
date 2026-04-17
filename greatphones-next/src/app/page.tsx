import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const htmlPath = join(process.cwd(), '../app.html')
  
  if (!existsSync(htmlPath)) {
    return NextResponse.json({ error: 'app.html not found' }, { status: 404 })
  }
  
  const html = readFileSync(htmlPath, 'utf-8')
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}