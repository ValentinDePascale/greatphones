import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export default function Page() {
  const paths = [
    join(process.cwd(), 'public', 'index.html'),
    join(process.cwd(), '..', 'public', 'index.html'),
  ]
  
  let html = ''
  for (const p of paths) {
    if (existsSync(p)) {
      html = readFileSync(p, 'utf-8')
      break
    }
  }
  
  return <div dangerouslySetInnerHTML={{ __html: html || '<h1>Not found</h1>' }} />
}