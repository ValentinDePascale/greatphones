import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export default function Home() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(htmlPath) 
    ? readFileSync(htmlPath, 'utf-8') 
    : '<h1>Loading...</h1>'
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }} 
      suppressHydrationWarning
    />
  )
}