'use client'

import { fmtARS } from './precios'

export interface PrecioItem {
  id: string
  modelo: string
  almacenamiento: string
  precioARS: number
  preventaARS: number
  descuentoARS: number
}

/** Copia texto al portapapeles con feedback. */
export async function copiarTexto(texto: string, mensaje?: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(texto)
    if (mensaje) alert(mensaje)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = texto
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      if (mensaje) alert(mensaje)
    } finally {
      document.body.removeChild(ta)
    }
  }
}

/** Texto plano de un precio (para copiar). */
export function textoPlanoPrecio(p: PrecioItem): string {
  return `📱 ${p.modelo}${p.almacenamiento ? ' ' + p.almacenamiento : ''}\n` +
    `Venta: ${fmtARS(p.precioARS)}\n` +
    `Preventa: ${fmtARS(p.preventaARS)}\n` +
    `Descuento: ${fmtARS(p.descuentoARS)}`
}

/** Texto de WhatsApp de un precio. */
export function textoWhatsAppPrecio(p: PrecioItem): string {
  return `📱 ${p.modelo}${p.almacenamiento ? ' ' + p.almacenamiento : ''}\n\n` +
    `💰 Precio contado:\n${fmtARS(p.precioARS)}\n\n` +
    `🔥 Precio preventa:\n${fmtARS(p.preventaARS)}\n\n` +
    `✅ Garantía de 12 meses`
}
