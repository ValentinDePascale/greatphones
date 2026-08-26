'use client'

/**
 * Puente entre las páginas legacy (cada una con su ruta real /admin/productos,
 * /admin/stock, etc.) y el shell SPA persistente que vive en el layout.
 * Cada página legacy llama activarTabLegacy('prods') desde un useEffect; el
 * AdminSpaHost escucha y ejecuta renderAdminContent(tab) sin round-trip.
 */

type Listener = (tab: string) => void
let listener: Listener | null = null
let lastTab: string | null = null
const launched = new Set<string>()

export function activarTabLegacy(tab: string) {
  lastTab = tab
  if (listener) {
    listener(tab)
    launched.add(tab)
  } else {
    // El host aún no está listo (scripts cargando); reintentamos.
    let tries = 0
    const iv = setInterval(() => {
      tries++
      if (listener) {
        clearInterval(iv)
        listener(tab)
        launched.add(tab)
      } else if (tries > 100) {
        clearInterval(iv)
      }
    }, 50)
  }
}

export function onTabLegacy(cb: Listener) {
  listener = cb
  // Si ya había un tab pedido antes de registrarnos, renderizarlo.
  if (lastTab) cb(lastTab)
  return () => { listener = null }
}

export function wasTabLaunched(tab: string): boolean {
  return launched.has(tab)
}