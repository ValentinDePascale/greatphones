import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export default function Home() {
  const possiblePaths = [
    join(process.cwd(), 'public', 'index.html'),
    join(process.cwd(), '..', 'public', 'index.html'),
    join(process.cwd(), '..', '..', 'public', 'index.html'),
  ]
  
  let html = '<h1>Loading...</h1>'
  
  for (const htmlPath of possiblePaths) {
    if (existsSync(htmlPath)) {
      html = readFileSync(htmlPath, 'utf-8')
      break
    }
  }
  
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  )
}