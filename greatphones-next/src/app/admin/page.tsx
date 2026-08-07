import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const htmlPath = join(process.cwd(), 'public', 'index.html')
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : '<h1>Admin no disponible</h1>'

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
  )
}
