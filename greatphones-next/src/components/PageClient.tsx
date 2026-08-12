'use client'

import { useEffect } from 'react'

export default function PageClient({ html }: { html: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      const w = window as any
      if (w._productsLoaded && typeof w.renderShopGrid === 'function') {
        w.renderShopGrid()
        w.renderOfertasGrid()
      }
      if (w._accLoaded && typeof w.renderAccGrid === 'function') {
        w.renderAccGrid()
      }
      if (document.getElementById('p-favoritos')?.classList.contains('act') && typeof w.renderFavGrid === 'function') {
        w.renderFavGrid()
      }
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
