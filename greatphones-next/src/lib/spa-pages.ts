import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const shellPath = join(process.cwd(), 'public', 'index.html')
const pagesDir = join(process.cwd(), 'public', 'pages')

let _shell = ''
let _homePage = ''

function loadShell() {
  if (_shell) return
  if (existsSync(shellPath)) _shell = readFileSync(shellPath, 'utf-8')
  const homePath = join(pagesDir, 'home.html')
  if (existsSync(homePath)) _homePage = readFileSync(homePath, 'utf-8')
}

function loadPage(pageId: string): string {
  const path = join(pagesDir, `${pageId}.html`)
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf-8')
}

function loadAllPages(): string {
  if (!existsSync(pagesDir)) return ''
  let html = _homePage || ''
  const { readdirSync } = require('fs')
  const files = readdirSync(pagesDir).filter((f: string) => f.endsWith('.html') && f !== 'home.html')
  for (const f of files) {
    html += readFileSync(join(pagesDir, f), 'utf-8')
  }
  return html
}

const adminScripts = ['/lib/admin.js', '/lib/admin-ui.js', '/lib/instore.js', '/lib/preventa.js', 'chart.js']

function removeAdminStuff(html: string): string {
  let result = html
  adminScripts.forEach(s => {
    result = result.replace(new RegExp(`<script[^>]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
  })
  result = result.replace(/<link[^>]*\/styles\/admin\.css[^>]*>/g, '')
  result = result.replace(/<link[^>]*\/styles\/wallet\.css[^>]*>/g, '')
  result = result.replace(/<link[^>]*\/styles\/coupons\.css[^>]*>/g, '')
  return result
}

function hideNonActivePages(html: string): string {
  // Add inline display:none to .page divs that DON'T have 'act' class
  html = html.replace(/class="page"(?! act)/g, 'class="page" style="display:none"')
  
  // Remove any second style attribute resulting from the merge
  // style="display:none" ...anything... style="any" → style="display:none" ...anything...
  html = html.replace(/(style="display:none"[^>]*?)\s+style="[^"]*"/g, '$1')
  
  return html
}
}

export function serveSpa(targetPage?: string): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'

  if (!targetPage || targetPage === 'home') {
    const allPages = loadAllPages()
    let fullSpa = _shell.replace('</body>', allPages + '</body>')
    fullSpa = hideNonActivePages(fullSpa)
    return removeAdminStuff(fullSpa)
  }

  const pageContent = loadPage(targetPage)
  if (!pageContent) return serveSpa('home')

  const pageContentAct = pageContent.replace(
    `class="page" id="p-${targetPage}"`,
    `class="page act" id="p-${targetPage}"`
  )

  let html = _shell.replace('</body>', pageContentAct + '</body>')
  html = hideNonActivePages(html)
  return removeAdminStuff(html)
}

export function serveAdminSpa(): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'
  let allPages = loadAllPages()
  let html = _shell.replace('</body>', allPages + '</body>')
  html = html.replace('class="page" id="p-admin"', 'class="page act" id="p-admin"')
  html = html.replace('class="page act" id="p-home"', 'class="page" id="p-home"')
  html = hideNonActivePages(html)
  return html
}
