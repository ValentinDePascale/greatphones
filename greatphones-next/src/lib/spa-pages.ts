import { readFileSync, existsSync, readdirSync } from 'fs'
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

let _allPages = ''

function loadAllPages(): string {
  if (_allPages) return _allPages
  if (!existsSync(pagesDir)) return ''
  let html = _homePage || ''
  // admin-login.html es el panel admin legacy MUERTO (adminLogin()=notAvailable,
  // sin ruta ni nav que lo alcancen). Se excluye porque comparte ids de chat
  // (adminConvList, adminChatName, etc.) con el chat admin nuevo y, al quedar
  // en el DOM, rompía los getElementById del chat (/admin/chat).
  const files = readdirSync(pagesDir).filter((f: string) => f.endsWith('.html') && f !== 'home.html' && f !== 'admin-login.html')
  for (const f of files) {
    html += readFileSync(join(pagesDir, f), 'utf-8')
  }
  _allPages = html
  return _allPages
}

const adminScripts = ['/lib/admin.js', '/lib/admin-ui.js', '/lib/instore.js', '/lib/preventa.js', 'chart.js']

function removeAdminStuff(html: string): string {
  let result = html
  adminScripts.forEach(s => {
    result = result.replace(new RegExp(`<script[^>]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
  })
  result = result.replace(/<link[^>]*\/styles\/admin\.css[^>]*>/g, '')
  // wallet.css NO se remueve: define .gc-amt (modal gift card) y .redeem-*
  // (canje de gift card en /cuenta), usados en la tienda p├║blica.
  // coupons.css NO se remueve: lo usan los cupones de usuario en /cuenta
  // (no es solo del admin).
  return result
}

function wrapMain(html: string): string {
  return html.replace('<body>', '<body><main id="main-content">').replace('</body>', '</main></body>')
}

export function serveSpa(targetPage?: string): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'

  // Always concatenate all pages so SPA navigation (nav('detail'), nav('login'),
  // nav('checkout'), etc.) works regardless of which SSR entry the user landed on.
  // The shell already includes all <script defer> tags that wire up the JS.
  // Only the initial visible page is marked as .act; the rest are inert.
  const allPages = loadAllPages()

  // If a target page is specified, ensure it's marked as .act in the concatenated output.
  // Otherwise keep home as .act (home is the default and home.html sets it).
  let pagesHtml = allPages
  if (targetPage && targetPage !== 'home') {
    // Strip any existing .act class on the home page that may come from home.html
    pagesHtml = pagesHtml.replace(
      'class="page act" id="p-home"',
      'class="page" id="p-home"'
    )
    // Activate the target page
    pagesHtml = pagesHtml.replace(
      `class="page" id="p-${targetPage}"`,
      `class="page act" id="p-${targetPage}"`
    )
  }

  // El shell define un marcador <!--GP_PAGES--> justo antes del footer global:
  // as├¡ las p├íginas quedan ANTES del footer (que es compartido en todo el sitio).
  let html
  if (_shell.includes('<!--GP_PAGES-->')) {
    html = _shell.replace('<!--GP_PAGES-->', pagesHtml)
  } else {
    html = _shell.replace('</body>', pagesHtml + '</body>')
  }
  html = html.replace('id="splash" style="position:fixed;inset:0;background:#FDF8F3;display:flex;align-items:center;justify-content:center;z-index:99999;flex-direction:column;gap:16px;transition:opacity .3s"', 'id="splash" style="display:none"');
  html = wrapMain(html)
  return removeAdminStuff(html)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function serveAdminSpa(activeTab?: string): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'
  // Cargamos TODAS las p├íginas (incluidas admin-product.html y admin-acc.html)
  // para que nav('admin-product') y nav('admin-acc') encuentren los inputs
  // del form (#prodId, #accId, etc.) en el DOM. Las p├íginas inactivas
  // quedan con .page{display:none} y se activan al navegar.
  const allPages = loadAllPages()
  let html
  if (_shell.includes('<!--GP_PAGES-->')) {
    html = _shell.replace('<!--GP_PAGES-->', allPages)
  } else {
    html = _shell.replace('</body>', allPages + '</body>')
  }
  html = html.replace('id="splash" style="position:fixed;inset:0;background:#FDF8F3;display:flex;align-items:center;justify-content:center;z-index:99999;flex-direction:column;gap:16px;transition:opacity .3s"', 'id="splash" style="display:none"');
  html = html.replace('class="page" id="p-admin"', 'class="page act" id="p-admin"')
  html = html.replace('class="page act" id="p-home"', 'class="page" id="p-home"')
  html = wrapMain(html)
  return html
}
