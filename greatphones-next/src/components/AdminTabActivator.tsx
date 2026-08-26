'use client'

import { useEffect } from 'react'
import { activarTabLegacy } from '@/lib/admin-activate'

/** Cada página legacy (productos, stock, pedidos, ...) rendera este componente
 *  vacío, que en el montaje pide activar su tab en el shell SPA persistente. */
export default function AdminTabActivator({ tab }: { tab: string }) {
  useEffect(() => {
    activarTabLegacy(tab)
  }, [tab])
  return null
}