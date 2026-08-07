import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const htmlPath = join(process.cwd(), 'public', 'index.html')

export function serveSpa(targetPage?: string): string {
  if (!existsSync(htmlPath)) return '<h1>Loading...</h1>'
  let html = readFileSync(htmlPath, 'utf-8')

  // Optimization: set initial page visibility
  if (targetPage && targetPage !== 'home') {
    // Remove 'act' from home
    html = html.replace(/class="page act" id="p-home"/, 'class="page" id="p-home"')
    // Add 'act' to target page
    const targetRegex = new RegExp(`class="page" id="p-${targetPage}"`, 'g')
    html = html.replace(targetRegex, `class="page act" id="p-${targetPage}"`)
  }

  // Optimization: remove admin-only scripts on public pages
  // Admin scripts: admin.js, admin-ui.js, instore.js, preventa.js, chart.js
  const adminScripts = ['/lib/admin.js', '/lib/admin-ui.js', '/lib/instore.js', '/lib/preventa.js', 'chart.js']
  adminScripts.forEach(script => {
    html = html.replace(new RegExp(`<script[^>]*${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
  })

  // Optimization: remove admin CSS on public pages  
  html = html.replace(/<link[^>]*\/styles\/admin\.css[^>]*>/g, '')
  html = html.replace(/<link[^>]*\/styles\/wallet\.css[^>]*>/g, '')
  html = html.replace(/<link[^>]*\/styles\/coupons\.css[^>]*>/g, '')

  return html
}

// For admin pages, serve the full HTML without optimizations
export function serveAdminSpa(): string {
  if (!existsSync(htmlPath)) return '<h1>Loading...</h1>'
  return readFileSync(htmlPath, 'utf-8')
}
