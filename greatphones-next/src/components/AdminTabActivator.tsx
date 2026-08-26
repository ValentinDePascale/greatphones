'use client'

import { useEffect } from 'react'
import { activarTabLegacy } from '@/lib/admin-activate'

/** Cada página legacy (productos, stock, pedidos, ...) rendera este componente
 *  vacío, que en el montaje (y en cada re-selección desde el sidebar) pide
 *  activar su tab en el shell SPA persistente. */
export default function AdminTabActivator({ tab }: { tab: string }) {
  useEffect(() => {
    activarTabLegacy(tab)

    // Re-selección: el sidebar dispara admin:nav aun si la ruta no cambia
    // (volver a entrar a la misma sección). Re-renderiza el tab en ese caso.
    const onNav = (e: Event) => {
      const t = (e as CustomEvent).detail
      if (t === tab) activarTabLegacy(tab)
    }
    window.addEventListener('admin:nav', onNav as EventListener)
    return () => window.removeEventListener('admin:nav', onNav as EventListener)
  }, [tab])

  return null
}