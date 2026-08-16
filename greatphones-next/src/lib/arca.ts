import { Arca, CbteTipo, CondicionIva, DocTipo, IvaTipo } from '@ramiidv/arca-facturacion'
import type { FacturarOpts, LineItem } from '@ramiidv/arca-facturacion'
import { logger } from '@/lib/logger'

export const ARCA_CBTE_TYPES = {
  A: CbteTipo.FACTURA_A,
  B: CbteTipo.FACTURA_B,
  C: CbteTipo.FACTURA_C,
} as const

export type ArcaCbteLetter = keyof typeof ARCA_CBTE_TYPES

const IVA_TASA = 21 / 100

export function arcaIsConfigured(): boolean {
  return Boolean(process.env.ARCA_CUIT && process.env.ARCA_CERT && process.env.ARCA_KEY)
}

export function arcaPtoVta(): number {
  const value = Number(process.env.ARCA_PTO_VTA || 1)
  return Number.isFinite(value) && value > 0 ? value : 1
}

let client: Arca | null = null

export function getArcaClient(): Arca {
  if (client) return client
  if (!arcaIsConfigured()) {
    throw new Error('ARCA no configurado: faltan ARCA_CUIT, ARCA_CERT o ARCA_KEY')
  }
  client = new Arca({
    cuit: Number(process.env.ARCA_CUIT),
    cert: process.env.ARCA_CERT!,
    key: process.env.ARCA_KEY!,
    production: process.env.ARCA_PRODUCTION === 'true',
    onEvent: e => logger.debug({ arca: e.type }, 'arca event'),
  })
  return client
}

export interface ArenaItemSource {
  name: string
  quantity: number
  price: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Convierte un importe (que ya incluye IVA) a su neto gravado.
 * Los precios de Great Phones se muestran con IVA incluido.
 */
export function netoDesdePrecioConIva(total: number): number {
  return round2(total / (1 + IVA_TASA))
}

/**
 * Construye los line items de la factura desde los items del pedido.
 * Para tipo C (monotributo) no se discrimina IVA: todo va a ImpNeto.
 */
export function buildLineItems(items: ArenaItemSource[], tipoC: boolean): LineItem[] {
  return items
    .filter(item => item.price > 0)
    .map(item => {
      const total = item.price * item.quantity
      const neto = tipoC ? round2(total) : netoDesdePrecioConIva(total)
      return tipoC ? { neto } : { neto, iva: IvaTipo.IVA_21 }
    })
}

export interface OrderReceptorData {
  clientCuil?: string | null
  clientDni?: string | null
  userDni?: string | null
}

export interface ReceptorOverrides {
  docTipo?: number
  docNro?: number
  condicionIva?: number
}

export interface ResolvedReceptor {
  docTipo: number
  docNro: number
  condicionIva: number
}

/**
 * Resuelve el documento del receptor según el tipo de comprobante.
 * - A: requiere CUIT del receptor (responsable inscripto)
 * - B: CUIT si está disponible, si no DNI, si no consumidor final
 * - C: consumidor final por defecto
 */
export function resolveReceptor(
  cbteTipo: ArcaCbteLetter,
  order: OrderReceptorData,
  overrides?: ReceptorOverrides,
): ResolvedReceptor {
  if (overrides?.docTipo && overrides.docNro) {
    return {
      docTipo: overrides.docTipo,
      docNro: overrides.docNro,
      condicionIva: overrides.condicionIva ?? CondicionIva.CONSUMIDOR_FINAL,
    }
  }

  const raw = (order.clientCuil || order.clientDni || order.userDni || '').replace(/\D/g, '')

  if (cbteTipo === 'A') {
    if (raw.length === 11) {
      return {
        docTipo: DocTipo.CUIT,
        docNro: Number(raw),
        condicionIva: CondicionIva.RESPONSABLE_INSCRIPTO,
      }
    }
    throw new Error('Factura A requiere el CUIT del cliente (11 dígitos)')
  }

  if (cbteTipo === 'B') {
    if (raw.length === 11) {
      return {
        docTipo: DocTipo.CUIT,
        docNro: Number(raw),
        condicionIva: CondicionIva.CONSUMIDOR_FINAL,
      }
    }
    if (raw.length >= 7 && raw.length <= 8) {
      return {
        docTipo: DocTipo.DNI,
        docNro: Number(raw),
        condicionIva: CondicionIva.CONSUMIDOR_FINAL,
      }
    }
  }

  return {
    docTipo: DocTipo.CONSUMIDOR_FINAL,
    docNro: 0,
    condicionIva: CondicionIva.CONSUMIDOR_FINAL,
  }
}

export interface BuildOptsInput {
  cbteTipo: ArcaCbteLetter
  items: ArenaItemSource[]
  receptor: OrderReceptorData
  overrides?: ReceptorOverrides & { ptoVta?: number; fecha?: string }
}

export interface BuiltInvoiceOpts {
  opts: FacturarOpts
  neto: number
  iva: number
  total: number
}

/**
 * Construye los FacturarOpts para el SDK ARCA a partir de un pedido.
 * Usa Arca.calcularTotales para que los importes guardados coincidan
 * exactamente con los que el SDK envía a ARCA.
 */
export function buildFacturarOpts(input: BuildOptsInput): BuiltInvoiceOpts {
  const { cbteTipo, items, receptor, overrides } = input
  const tipoC = cbteTipo === 'C'
  const resolved = resolveReceptor(cbteTipo, receptor, overrides)

  const lineItems = buildLineItems(items, tipoC)
  const { importes } = Arca.calcularTotales(lineItems, { tipoC })

  const opts: FacturarOpts = {
    ptoVta: overrides?.ptoVta ?? arcaPtoVta(),
    cbteTipo: ARCA_CBTE_TYPES[cbteTipo],
    items: lineItems,
    docTipo: resolved.docTipo,
    docNro: resolved.docNro,
    condicionIva: resolved.condicionIva,
  }
  if (overrides?.fecha) opts.fecha = overrides.fecha

  return {
    opts,
    neto: importes.neto,
    iva: importes.iva,
    total: importes.total,
  }
}

/** Convierte un vencimiento YYYYMMDD de ARCA a Date. */
export function caeExpiryToDate(value: string): Date {
  const y = Number(value.slice(0, 4))
  const m = Number(value.slice(4, 6)) - 1
  const d = Number(value.slice(6, 8))
  return new Date(y, m, d, 23, 59, 59)
}

export interface QuoteForInvoice {
  device: string
  storage: string
  finalPrice: number
  clientDni?: string | null
  clientName?: string | null
}

/**
 * Construye las opciones de facturación ARCA para una cotización aceptada.
 * Emite Factura C (compra de usado a consumidor final).
 * Si el cliente tiene DNI válido (7-8 dígitos), se identifica con DNI;
 * caso contrario, queda como consumidor final.
 */
export function buildFacturarOptsFromQuote(quote: QuoteForInvoice): BuiltInvoiceOpts {
  const cbteTipo: ArcaCbteLetter = 'C'
  const items: ArenaItemSource[] = [
    {
      name: `Compra de usado: ${quote.device} ${quote.storage}`.trim(),
      quantity: 1,
      price: quote.finalPrice,
    },
  ]

  const tipoC = true
  const lineItems = buildLineItems(items, tipoC)
  const { importes } = Arca.calcularTotales(lineItems, { tipoC })

  // Resolver receptor: DNI válido si está disponible
  const rawDni = (quote.clientDni || '').replace(/\D/g, '')
  let docTipo: number
  let docNro: number
  let condicionIva: number

  if (rawDni.length >= 7 && rawDni.length <= 8) {
    docTipo = DocTipo.DNI
    docNro = Number(rawDni)
    condicionIva = CondicionIva.CONSUMIDOR_FINAL
  } else if (rawDni.length === 11) {
    docTipo = DocTipo.CUIT
    docNro = Number(rawDni)
    condicionIva = CondicionIva.CONSUMIDOR_FINAL
  } else {
    docTipo = DocTipo.CONSUMIDOR_FINAL
    docNro = 0
    condicionIva = CondicionIva.CONSUMIDOR_FINAL
  }

  const opts: FacturarOpts = {
    ptoVta: arcaPtoVta(),
    cbteTipo: ARCA_CBTE_TYPES[cbteTipo],
    items: lineItems,
    docTipo,
    docNro,
    condicionIva,
  }

  return {
    opts,
    neto: importes.neto,
    iva: importes.iva,
    total: importes.total,
  }
}
