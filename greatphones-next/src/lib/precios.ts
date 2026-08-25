/**
 * Utilidades compartidas del módulo de Precios (panel admin).
 * Formateo de moneda y helpers de dolarapi (USD en vivo).
 */

export function fmtARS(n: number): string {
  return '$' + (n || 0).toLocaleString('es-AR')
}

export function fmtUSD(n: number): string {
  const v = Number(n) || 0
  return 'US$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/**
 * Valor en USD a partir de un monto en pesos usando la cotización actual.
 * `dolarVenta` en pesos por dólar (puede venir de dolarapi o fallback).
 */
export function pesosAUsd(pesos: number, dolarVenta: number): number {
  if (!dolarVenta || dolarVenta <= 0) return 0
  return Math.round((Number(pesos) || 0) / dolarVenta)
}

/** Conversión inversa: USD → pesos. */
export function usdAPesos(usd: number, dolarVenta: number): number {
  return Math.round((Number(usd) || 0) * (dolarVenta || 0))
}

export interface DolarApiResponse {
  venta: number
  compra: number
  fecha?: string
  fuente?: string
}

/**
 * Tipos de dólar soportados por dolarapi.com.ar.
 */
export type DolarTipo = 'oficial' | 'blue' | 'tarjeta' | 'mayorista' | 'cripto' | 'bolsa' | 'contadoconliqui'

const DOLAR_ENDPOINTS: Record<DolarTipo, string> = {
  oficial: 'https://dolarapi.com.ar/v1/dolares/oficial',
  blue: 'https://dolarapi.com.ar/v1/dolares/blue',
  tarjeta: 'https://dolarapi.com.ar/v1/dolares/tarjeta',
  mayorista: 'https://dolarapi.com.ar/v1/dolares/mayorista',
  cripto: 'https://dolarapi.com.ar/v1/dolares/cripto',
  bolsa: 'https://dolarapi.com.ar/v1/dolares/bolsa',
  contadoconliqui: 'https://dolarapi.com.ar/v1/dolares/contadoconliqui',
}

const DOLAR_CACHE_TTL = 10 * 60 * 1000 // 10 min
let dolarCache: { tipo: DolarTipo; data: DolarApiResponse; at: number } | null = null

/**
 * Obtiene la cotización de un tipo de dólar desde dolarapi.com.ar.
 * Con caché en memoria (TTL 10 min) para no pegarle a la API en cada request.
 * Devuelve null si no se puede resolver (para no romper la UI).
 */
export async function obtenerDolar(tipo: DolarTipo = 'blue'): Promise<DolarApiResponse | null> {
  if (dolarCache && dolarCache.tipo === tipo && Date.now() - dolarCache.at < DOLAR_CACHE_TTL) {
    return dolarCache.data
  }
  try {
    const res = await fetch(DOLAR_ENDPOINTS[tipo], {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const json = await res.json()
    const data: DolarApiResponse = {
      venta: Number(json.venta) || 0,
      compra: Number(json.compra) || 0,
      fecha: json.fecha,
      fuente: 'dolarapi',
    }
    dolarCache = { tipo, data, at: Date.now() }
    return data
  } catch (e) {
    return null
  }
}

/** Cotización de venta (o fallback) para mostrar en la UI. */
export async function dolarVentaActual(tipo: DolarTipo = 'blue'): Promise<number> {
  const d = await obtenerDolar(tipo)
  return d && d.venta > 0 ? d.venta : 0
}
