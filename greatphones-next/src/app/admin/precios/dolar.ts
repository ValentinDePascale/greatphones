'use client'

export interface DolarData {
  venta: number
  compra: number
  fecha?: string
  fuente?: string
}

/** Trae la cotización (compra y venta) de un tipo de dólar desde la API del panel admin. Devuelve null si falla. */
export async function fetchDolar(tipo: 'blue' | 'oficial' | 'tarjeta' = 'blue'): Promise<DolarData | null> {
  try {
    const r = await fetch(`/api/admin/precios/dolar?tipo=${tipo}`, { credentials: 'include', cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    return d && d.venta > 0 ? d : null
  } catch {
    return null
  }
}

/** Trae solo el valor de venta del dólar (para backward compatibility). */
export async function fetchDolarVenta(tipo: 'blue' | 'oficial' | 'tarjeta' = 'blue'): Promise<number | null> {
  const d = await fetchDolar(tipo)
  return d && d.venta > 0 ? d.venta : null
}
