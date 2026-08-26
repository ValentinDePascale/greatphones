import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const shellPath = join(process.cwd(), 'public', 'index.html')
const adminShellPath = join(process.cwd(), 'public', 'admin-shell.html')
const pagesDir = join(process.cwd(), 'public', 'pages')

let _shell = ''
let _adminShell = ''
let _homePage = ''

function loadShell() {
  if (_shell) return
  if (existsSync(shellPath)) _shell = readFileSync(shellPath, 'utf-8')
  const homePath = join(pagesDir, 'home.html')
  if (existsSync(homePath)) _homePage = readFileSync(homePath, 'utf-8')
}

/** Shell del panel admin: HTML mínimo SIN topbar/footer/carrito/chat/buscador
 *  de la tienda pública — solo el panel + modales/toasts + scripts admin. */
function loadAdminShell() {
  if (_adminShell) return
  if (existsSync(adminShellPath)) _adminShell = readFileSync(adminShellPath, 'utf-8')
}

let _allPages = ''
let _adminPages = ''

function loadAllPages(): string {
  if (_allPages) return _allPages
  if (!existsSync(pagesDir)) return ''
  let html = _homePage || ''
  const files = readdirSync(pagesDir).filter((f: string) => f.endsWith('.html') && f !== 'home.html')
  for (const f of files) {
    html += readFileSync(join(pagesDir, f), 'utf-8')
  }
  _allPages = html
  return _allPages
}

/** Páginas del panel admin: solo las que el admin realmente necesita (evita
 *  numerar las ~30 páginas de la tienda pública en el DOM del panel). */
function loadAdminPages(): string {
  if (_adminPages) return _adminPages
  if (!existsSync(pagesDir)) return ''
  const files = readdirSync(pagesDir)
    .filter((f: string) => f.endsWith('.html') && (f.startsWith('admin') || f === 'home.html'))
  _adminPages = files.map(f => readFileSync(join(pagesDir, f), 'utf-8')).join('')
  return _adminPages
}

const adminScripts = ['/lib/admin.js', '/lib/admin-ui.js', '/lib/instore.js', '/lib/preventa.js', 'chart.js']

function removeAdminStuff(html: string): string {
  let result = html
  adminScripts.forEach(s => {
    result = result.replace(new RegExp(`<script[^>]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*></script>`, 'g'), '')
  })
  result = result.replace(/<link[^>]*\/styles\/admin\.css[^>]*>/g, '')
  // wallet.css NO se remueve: define .gc-amt (modal gift card) y .redeem-*
  // (canje de gift card en /cuenta), usados en la tienda pública.
  // coupons.css NO se remueve: lo usan los cupones de usuario en /cuenta
  // (no es solo del admin).
  return result
}

/**
 * Scripts que el panel admin realmente necesita. El shell index.html declara
 * ~31 scripts de la tienda (cart, checkout, wallet, giftcard, coupons, etc.)
 * que el panel NO usa. Para el panel conservamos solo esta lista blanca y
 * removemos el resto: menos JS por request (~400KB menos).
 */
const ADMIN_ALLOWED_SCRIPTS = [
  '/vendor/gsap/gsap.min.js',
  '/lib/constants.js',
  '/lib/storage.js',
  '/lib/utils.js',
  '/lib/fetch-wrapper.js',
  '/lib/navigation.js',
  '/lib/notifications.js',
  '/lib/admin.js',
  '/lib/admin-ui.js',
  '/lib/instore.js',
  '/lib/preventa.js',
  '/lib/render.js',
  '/lib/dolarapi.js',
  '/lib/scanner.js',
  '/lib/chat.js',
  'socket.io.min.js',
  'chart.umd.min.js',
  'html5-qrcode.min.js',
]

function removeStoreScripts(html: string): string {
  const keep = (src: string) => ADMIN_ALLOWED_SCRIPTS.some(a => src.includes(a.replace(/^\//, '')) || src.includes(a))
  return html.replace(/<script([^>]*)src="([^"]*)"([^>]*)><\/script>/gi, (m, pre: string, src: string, post: string) => {
    return keep(src) ? m : ''
  })
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
  // así las páginas quedan ANTES del footer (que es compartido en todo el sitio).
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
export function serveAdminSpa(activeTab?: string, html?: string): string {
  // Prioridad: si nos pasan un shell admin listo (cache del layout), lo usamos.
  if (html) return html
  loadAdminShell()
  if (!_adminShell) return '<h1>Loading...</h1>'
  // Sólo las páginas admin (admin.html + admin-product + admin-acc + admin-login),
  // NO las ~30 de la tienda pública: el panel no navega a home/shop/checkout/etc.
  const allPages = loadAdminPages()
  let out
  if (_adminShell.includes('<!--GP_ADMIN_PAGES-->')) {
    out = _adminShell.replace('<!--GP_ADMIN_PAGES-->', allPages)
  } else {
    out = _adminShell.replace('</body>', allPages + '</body>')
  }
  out = out.replace('id="splash" style="position:fixed;inset:0;background:#FDF8F3;display:flex;align-items:center;justify-content:center;z-index:99999;flex-direction:column;gap:16px;transition:opacity .3s"', 'id="splash" style="display:none"');
  out = out.replace('class="page" id="p-admin"', 'class="page act" id="p-admin"')
  out = out.replace('class="page act" id="p-home"', 'class="page" id="p-home"')
  return wrapMain(out)
}
