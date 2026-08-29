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

function loadLegacyScriptsSequential(html: string): Promise<void> {
  const w = window as any
  const loaded: Set<string> = (w.__gpLoadedScripts = w.__gpLoadedScripts || new Set<string>())
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
  if (toLoad.length === 0) return Promise.resolve()
  toLoad.forEach(src => loaded.add(src))
  return toLoad.reduce((prev, src) => {
    return prev.then(
      () =>
        new Promise<void>((resolve, reject) => {
          const el = document.createElement('script')
          el.src = src
          el.async = false
          el.setAttribute('data-gp', '1')
          el.onload = () => resolve()
          el.onerror = () => {
            loaded.delete(src)
            reject(new Error(`legacy script failed: ${src}`))
          }
          document.head.appendChild(el)
        }),
    )
  }, Promise.resolve())
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
      prods: 'Productos', inventory: 'Inventario',
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

    let cancelled = false
    let pollIv: number | undefined
    const ensureLegacyReady = async () => {
      try {
        await loadLegacyScriptsSequential(html)
      } catch {}
      if (cancelled) return
      let attempts = 0
      const MAX_ATTEMPTS = 80
      pollIv = window.setInterval(() => {
        const w2 = window as any
        if (typeof w2.renderAdminContent !== 'function') {
          attempts++
          if (attempts >= MAX_ATTEMPTS) window.clearInterval(pollIv)
          return
        }
        try {
          w2.renderAdminContent(tab)
        } catch {
          attempts++
          if (attempts >= MAX_ATTEMPTS) window.clearInterval(pollIv)
          return
        }
        const el = document.getElementById('adminContent')
        const populated = el && el.innerHTML.trim() !== ''
        if (populated || attempts >= MAX_ATTEMPTS) window.clearInterval(pollIv)
        attempts++
      }, 120) as unknown as number
      const w0 = window as any
      if (typeof w0.renderAdminContent === 'function') {
        try {
          w0.renderAdminContent(tab)
        } catch {}
      }
    }
    ensureLegacyReady()

    return () => {
      cancelled = true
      if (pollIv) window.clearInterval(pollIv)
    }
  }, [tab, html])

  return (
    <div
      key={tab}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
