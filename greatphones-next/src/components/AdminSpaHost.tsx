'use client'

import { useEffect, useRef } from 'react'
import { onTabLegacy } from '@/lib/admin-activate'

// Rutas de las secciones React (nuevas). Todo lo que NO empiece con estos
// prefijos es una sección legacy que vive dentro del shell (#p-admin).
const REACT_PREFIXES = [
  '/admin/ops', '/admin/precios', '/admin/taller', '/admin/analisis',
  '/admin/inventario', '/admin/gestion', '/admin/comprados', '/admin/auditoria',
  '/admin/inversores', '/admin/contabilidad', '/admin/reparaciones',
]

export function isLegacyPath(pathname: string): boolean {
  if (pathname === '/admin') return true
  return !REACT_PREFIXES.some(p => pathname.startsWith(p))
}

interface Props {
  html: string
  legacy: boolean
}

const MAX_RETRIES = 120

/** Host del shell admin legacy (SPA): inyecta el HTML UNA sola vez de forma
 *  manual (no dangerouslySetInnerHTML), inmune a re-renders de React que
 *  podían vaciar el DOM del shell. Persiste oculto en secciones React. */
export default function AdminSpaHost({ html, legacy }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const injectedRef = useRef(false)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const host = hostRef.current as HTMLDivElement | null

    // Inyección manual del shell (solo una vez). Los <script> incluidos se
    // re-ejecutan manualmente para que renderAdminContent quede disponible.
    if (host && !injectedRef.current) {
      injectedRef.current = true
      host.innerHTML = html
      // Re-ejecutar <script src> del shell (innerHTML no los ejecuta).
      host.querySelectorAll<HTMLScriptElement>('script[src]').forEach(old => {
        const s = document.createElement('script')
        s.src = old.src
        s.async = true
        old.replaceWith(s)
      })
    }

    const activate = () => {
      const pAdmin = document.getElementById('p-admin')
      if (pAdmin) {
        pAdmin.classList.add('act')
        pAdmin.style.display = 'block'
        pAdmin.querySelector('.admin-layout')?.classList.add('act')
        pAdmin.querySelector('.admin-main')?.classList.add('act')
      }
    }

    const renderNow = (tab: string) => {
      activate()
      const w = window as any
      if (typeof w.renderAdminContent === 'function') {
        w.renderAdminContent(tab)
        return true
      }
      return false
    }

    const render = (tab: string) => {
      if (renderNow(tab)) return
      let tries = 0
      const iv = window.setInterval(() => {
        tries++
        if (renderNow(tab)) {
          window.clearInterval(iv)
        } else if (tries > MAX_RETRIES) {
          window.clearInterval(iv)
        }
      }, 100)
      timersRef.current.push(iv)
    }

    const onDirectNav = (e: Event) => {
      const tab = (e as CustomEvent).detail
      if (typeof tab === 'string') render(tab)
    }

    const off = onTabLegacy(render)
    window.addEventListener('admin:nav', onDirectNav as EventListener)

    // Renderear el tab inicial una vez que React haya montado (deep-link).
    // El activador de la página lo pedirá; acá nos aseguramos por si no.
    return () => {
      off()
      window.removeEventListener('admin:nav', onDirectNav as EventListener)
      timersRef.current.forEach(id => window.clearInterval(id))
      timersRef.current = []
    }
  }, [html])

  return (
    <div
      ref={hostRef}
      id="admin-spa-host"
      suppressHydrationWarning
      style={{ display: legacy ? 'block' : 'none' }}
    />
  )
}