'use client'

import { useEffect } from 'react'
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

/** Host del shell admin legacy (SPA): se monta UNA vez y persiste en el DOM,
 *  oculto cuando la ruta actual es una sección React. Las páginas legacy
 *  llaman activarTabLegacy(tab) y acá se ejecuta renderAdminContent(tab). */
export default function AdminSpaHost({ html, legacy }: Props) {
  useEffect(() => {
    const activate = () => {
      const pAdmin = document.getElementById('p-admin')
      if (pAdmin) {
        pAdmin.classList.add('act')
        pAdmin.style.display = 'block'
        pAdmin.querySelector('.admin-layout')?.classList.add('act')
        pAdmin.querySelector('.admin-main')?.classList.add('act')
      }
    }

    const render = (tab: string) => {
      activate()
      const w = window as any
      if (typeof w.renderAdminContent === 'function') {
        w.renderAdminContent(tab)
      }
    }

    // Suscribirse al puente que usan las páginas legacy. Puede ser que los
    // scripts aún estén cargando; el puente reintentará.
    const off = onTabLegacy(render)
    return () => { off() }
  }, [])

  return (
    <div
      id="admin-spa-host"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
      style={{ display: legacy ? 'block' : 'none' }}
    />
  )
}