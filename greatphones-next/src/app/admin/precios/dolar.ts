'use client'

/** Trae la cotización de venta de un tipo de dólar desde la API del panel admin. Devuelve null si falla. */
export async function fetchDolar(tipo: 'blue' | 'oficial' | 'tarjeta' = 'blue'): Promise<number | null> {
  try {
    const r = await fetch(`/api/admin/precios/dolar?tipo=${tipo}`, { credentials: 'include', cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    return d && d.venta > 0 ? d.venta : null
  } catch {
    return null
  }
}
