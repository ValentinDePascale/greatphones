'use client'

import { useEffect } from 'react'

// El contenido admin legacy (render.js, admin.js, etc.) viaja como <script src>
// dentro del HTML del shell que inyectamos con dangerouslySetInnerHTML. El
// browser NO ejecuta scripts insertados por innerHTML, asi que en una
// navegacion client-side esos scripts nunca corrian y el tab quedaba en blanco
// hasta recargar la pagina (donde el documento SSR si los ejecuta). Cargamos
// esos scripts una sola vez por sesion (dedup contra los que ya estan en el
// documento, por ej. en una carga completa) recreando el entorno del load.
interface Props {
  html: string
  tab: string
}

const SCRIPT_SRC_RE = /<script[^>]*\bsrc=["']([^"']+)["']/g

function loadLegacyScripts(html: string): void {
  const w = window as any
  const loaded: Set<string> = (w.__gpLoadedScripts = w.__gpLoadedScripts || new Set<string>())
  // Si el runtime legacy YA se ejecutó en este documento (p.ej. entramos por
  // una carga completa a /admin/<tab>, o ya lo cargamos antes en la sesión),
  // renderAdminContent está definido y no hay que volver a ejecutar nada.
  // OJO: no podemos detectar scripts "ya ejecutados" por su presencia en el DOM:
  // los <script> que quedan del innerHTML del shell están en el DOM pero nunca
  // se ejecutaron (innerHTML no corre scripts).
  const alreadyExecuted = typeof w.renderAdminContent === 'function'
  const toLoad: string[] = []
  const re = new RegExp(SCRIPT_SRC_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const src = m[1]
    if (!src || loaded.has(src)) continue
    if (alreadyExecuted) {
      loaded.add(src)
      continue
    }
    toLoad.push(src)
  }
  if (toLoad.length === 0) return
  // Marcamos como cargados AL ENCOLARLOS (antes de que terminen) para no
  // duplicar la ejecución si el efecto corre dos veces (React StrictMode en
  // dev) o el componente se monta de nuevo antes de que terminen de cargar.
  toLoad.forEach(src => loaded.add(src))
  // async=false conserva el orden del documento (como el defer del shell).
  toLoad.forEach(src => {
    const el = document.createElement('script')
    el.src = src
    el.async = false
    el.setAttribute('data-gp', '1')
    document.head.appendChild(el)
  })
}

export default function AdminPageClient({ html, tab }: Props) {
  useEffect(() => {
    // Marcar p-admin y sus wrappers internos como visibles. El AdminSidebar
    // de React ocupa el slot izquierdo del layout, pero el contenido del admin
    // (dashboard, productos, etc.) se inyecta dentro de <div id="p-admin">
    // que viene del HTML legacy. Sin hacer visible p-admin, todo el contenido
    // queda oculto por el CSS .page { display: none } que oculta todas las
    // pages del SPA legacy.
    const pAdmin = document.getElementById('p-admin')
    if (pAdmin) {
      pAdmin.classList.add('act')
      pAdmin.style.display = 'block'
      // El sidebar HTML dentro de p-admin ya est├í oculto por globals.css
      // (#p-admin .admin-sidebar { display: none }), as├¡ que solo queda el main
      pAdmin.querySelector('.admin-layout')?.classList.add('act')
      pAdmin.querySelector('.admin-main')?.classList.add('act')
    }

    // Actualizar el t├¡tulo del topbar y activar el bot├│n del sidebar de forma
    // inmediata (antes de que renderAdminContent cargue) para evitar que
    // parpadee "Dashboard" al navegar directo a /admin/<tab>.
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', prods: 'Productos', inventory: 'Inventario',
      acc: 'Accesorios', stock: 'Stock', promos: 'Promociones',
      orders: 'Pedidos', arrep: 'Arrepentimientos', chat: 'Chat',
      quotes: 'Cotizaciones', instore: 'Venta en Tienda', preventa: 'Preventas',
      sales: 'Historial de Ventas', users: 'Usuarios', cupones: 'Cupones',
    }
    const titleEl = document.getElementById('adminPageTitle')
    if (titleEl && titles[tab]) titleEl.textContent = titles[tab]
    const navBtn = document.getElementById('adm-' + tab)
    if (navBtn) {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('act'))
      navBtn.classList.add('act')
    }

    // Renderizar el contenido del tab de forma robusta. El shell legacy carga
    // sus scripts con `defer` (render.js/admin.js son pesados y con cache-busting
    // ?v=), por lo que pueden no estar listos cuando este useEffect corre. En vez
    // de un setTimeout fijo de 300ms sin reintento (que dejaba el contenido en
    // blanco intermitentemente), esperamos a que renderAdminContent exista y
    // verificamos que el contenido se pobló, reintentando hasta un timeout total.
    // Ademas, en navegacion client-side esos scripts nunca se ejecutan (innerHTML
    // no corre scripts): los cargamos explicitamente con loadLegacyScripts.
    loadLegacyScripts(html)
    let attempts = 0
    const MAX_ATTEMPTS = 60 // ~9s
    const iv = window.setInterval(() => {
      const w = window as any
      if (typeof w.renderAdminContent !== 'function') {
        attempts++
        if (attempts >= MAX_ATTEMPTS) window.clearInterval(iv)
        return
      }
      try {
        w.renderAdminContent(tab)
      } catch (e) {
        attempts++
        if (attempts >= MAX_ATTEMPTS) window.clearInterval(iv)
        return
      }
      const el = document.getElementById('adminContent')
      const populated = el && el.innerHTML.trim() !== ''
      if (populated || attempts >= MAX_ATTEMPTS) window.clearInterval(iv)
      attempts++
    }, 150)

    return () => window.clearInterval(iv)
  }, [tab])

  return (
    <div
      key={tab}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
