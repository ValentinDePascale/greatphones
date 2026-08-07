import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const htmlPath = join(process.cwd(), 'public', 'index.html')

// Cache: split once on first use
let _prefix = ''
let _suffix = ''
let _pages: Record<string, string> = {}
let _loaded = false

function loadSections() {
  if (_loaded) return
  _loaded = true

  if (!existsSync(htmlPath)) return
  const html = readFileSync(htmlPath, 'utf-8')

  // Find first page div (p-home)
  const firstPageIdx = html.indexOf('<div class="page act" id="p-home"')
  if (firstPageIdx === -1) { _prefix = html; return }

  // Extract prefix (everything before first page)
  _prefix = html.substring(0, firstPageIdx)

  // Find scripts section (after last page close)
  // The last page div should be followed by scripts
  const scriptMatch = html.match(/<script>\s*var API_URL/)
  let suffixStart = html.length
  if (scriptMatch) {
    suffixStart = html.indexOf(scriptMatch[0])
  }
  // Extract suffix (scripts)
  _suffix = html.substring(suffixStart)

  // Extract all page sections
  const pageRegex = /<div class="page(?: act)?" id="p-(\w[\w-]*)"/g
  let match: RegExpExecArray | null
  const pageStarts: { id: string; start: number }[] = []

  while ((match = pageRegex.exec(html)) !== null) {
    pageStarts.push({ id: match[1], start: match.index })
  }

  // For each page, extract from its start to the start of the next page (or to scripts)
  for (let i = 0; i < pageStarts.length; i++) {
    const cur = pageStarts[i]
    const next = pageStarts[i + 1]
    const end = next ? next.start : suffixStart
    _pages[cur.id] = html.substring(cur.start, end)
    // Fix nesting: find the actual closing </div> for the outermost page div
    const trimmed = closeOutermostDiv(_pages[cur.id])
    if (trimmed) _pages[cur.id] = trimmed
  }
}

function closeOutermostDiv(html: string): string {
  // Count opening/closing divs from the first <div
  let depth = 0
  let i = html.indexOf('<div')
  if (i === -1) return html

  // Find matching closing </div>
  const divRegex = /<\/div>|<div[^>]*>/g
  let lastClose = html.length

  while ((i = html.indexOf('<div' as unknown as string, i + 1)) !== -1) depth++
  // Simpler approach: just find the matching </div> at the root level
  // Reset and use regex
  let match: RegExpExecArray | null
  const re = /<(\/)?div[^>]*>/g
  depth = 0
  while ((match = re.exec(html)) !== null) {
    if (match[1]) { // closing tag
      depth--
      if (depth === 0) {
        lastClose = match.index + match[0].length
        break
      }
    } else { // opening tag
      depth++
    }
  }

  return html.substring(0, lastClose)
}

function getSection(pageId: string): string {
  loadSections()
  return _pages[pageId] || ''
}

const adminScripts = ['/lib/admin.js', '/lib/admin-ui.js', '/lib/instore.js', '/lib/preventa.js', 'chart.js']

export function serveSpa(targetPage?: string): string {
  loadSections()

  if (!targetPage || targetPage === 'home') {
    // Home: keep all pages (SPA navigation intact), but hide home content for other initial pages
    return buildFullSpa('home', false)
  }

  // For non-home pages: extract only the target page
  const pageHtml = getSection(targetPage)
  if (!pageHtml) return buildFullSpa(targetPage, false)

  // Remove admin scripts from public pages
  let suffix = _suffix
  adminScripts.forEach(s => {
    suffix = suffix.replace(new RegExp(`<script[^>]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
  })

  // Build: prefix + target page + suffix
  return _prefix + `<div class="page act" id="p-${targetPage}">${pageHtml}</div>` + suffix
}

function buildFullSpa(initialPage: string, isAdmin: boolean): string {
  if (!existsSync(htmlPath)) return '<h1>Loading...</h1>'
  let html = readFileSync(htmlPath, 'utf-8')

  // Set initial page visibility
  if (initialPage && initialPage !== 'home') {
    html = html.replace(/class="page act" id="p-home"/, 'class="page" id="p-home"')
    html = html.replace(new RegExp(`class="page" id="p-${initialPage}"`, 'g'), `class="page act" id="p-${initialPage}"`)
  }

  if (!isAdmin) {
    // Remove admin JS
    adminScripts.forEach(s => {
      html = html.replace(new RegExp(`<script[^>]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
    })
    // Remove admin CSS
    html = html.replace(/<link[^>]*\/styles\/admin\.css[^>]*>/g, '')
    html = html.replace(/<link[^>]*\/styles\/wallet\.css[^>]*>/g, '')
    html = html.replace(/<link[^>]*\/styles\/coupons\.css[^>]*>/g, '')
  }

  return html
}

export function serveAdminSpa(): string {
  return buildFullSpa('admin', true)
}
