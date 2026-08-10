import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const shellPath = join(process.cwd(), 'public', 'index.html')
const pagesDir = join(process.cwd(), 'public', 'pages')

// Cache the shell (prefix + scripts) on first use
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
  let html = ''
  // Load all pages in order
  // We need them for SPA navigation on the home page
  const re = /<div class="page(?: act)?" id="p-(\w[\w-]*)"/
  const homeHtml = _homePage
  if (!homeHtml) return ''
  const m = homeHtml.match(re)
  if (!m) return ''
  html += homeHtml
  // Load remaining pages
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

export function serveSpa(targetPage?: string): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'

  if (!targetPage || targetPage === 'home') {
    // Home: include all pages for full SPA navigation
    const allPages = loadAllPages()
    let fullSpa = _shell.replace('</body>', allPages + '</body>')
    return removeAdminStuff(fullSpa)
  }

  // Non-home pages: only include the target page
  const pageContent = loadPage(targetPage)
  if (!pageContent) {
    return serveSpa('home')
  }

  // Replace class="page" with class="page act" for the target page
  const pageContentAct = pageContent.replace(
    `class="page" id="p-${targetPage}"`,
    `class="page act" id="p-${targetPage}"`
  )

  let html = _shell.replace('</body>', pageContentAct + '</body>')
  return removeAdminStuff(html)
}

export function serveAdminSpa(): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'
  let allPages = loadAllPages()
  // Keep home as hidden, admin page doesn't need to be visible initially
  // The SPA JS handles the tab navigation
  let html = _shell.replace('</body>', allPages + '</body>')
  // Make admin page the active one
  html = html.replace('class="page" id="p-admin"', 'class="page act" id="p-admin"')
  html = html.replace('class="page act" id="p-home"', 'class="page" id="p-home"')
  return html
}
