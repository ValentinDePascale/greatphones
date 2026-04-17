import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const htmlPath = path.join(process.cwd(), '..', 'app.html')
  
  try {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'HTML not found' }, { status: 404 })
  }
}