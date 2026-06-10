import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const htmlPath = join(process.cwd(), 'public', 'index.html')
const cachedHtml = existsSync(htmlPath)
  ? readFileSync(htmlPath, 'utf-8')
  : '<h1>Loading...</h1>'

export default function Home() {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: cachedHtml }}
      suppressHydrationWarning
    />
  )
}