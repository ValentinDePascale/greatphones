import { prisma } from '@/lib/prisma'

/** Catálogo de trabajos de reparación (mismas claves que Toma de Equipos + las nuevas). */
export const REPARACIONES_ITEMS = [
  { key: 'bateria', label: 'Batería' },
  { key: 'pantalla', label: 'Pantalla' },
  { key: 'camara', label: 'Cámara' },
  { key: 'microfono', label: 'Micrófono' },
  { key: 'parlante', label: 'Parlante' },
  { key: 'tapa', label: 'Tapa trasera' },
  { key: 'marco', label: 'Marco' },
  { key: 'pin', label: 'Pin de carga' },
  { key: 'flex', label: 'Flex de carga' },
  { key: 'botones', label: 'Botones laterales' },
  { key: 'chasis', label: 'Chasis' },
] as const

export type ReparacionKey = (typeof REPARACIONES_ITEMS)[number]['key']

export interface TrabajoResult {
  nombre: string
  precio: number | null
  sinConfigurar?: boolean
  motivo?: string
  descuentoToma?: number
  multiplicador?: number
}

export interface PresupuestoResult {
  trabajos: TrabajoResult[]
  precioTotal: number
  horasEstimadas: number
  estado: 'COTIZADO' | 'DIAGNOSTICO'
}

/**
 * Calcula el presupuesto de una reparación para un modelo y un conjunto de
 * trabajos marcados (mismo método histórico del ERP: descuentoToma ×
 * multiplicador, con fallback a "sin configurar").
 * Si `esDiagnostico` es true, devuelve estado DIAGNOSTICO sin calcular.
 */
export async function calcularPresupuesto(
  modelo: string,
  trabajosMarcados: Partial<Record<ReparacionKey, boolean>>,
  esDiagnostico = false,
): Promise<PresupuestoResult> {
  if (esDiagnostico) {
    return { trabajos: [], precioTotal: 0, horasEstimadas: 48, estado: 'DIAGNOSTICO' }
  }

  const equipo = await prisma.priceTradeIn.findFirst({ where: { modelo, active: true } })
  if (!equipo) throw new Error(`Modelo "${modelo}" no encontrado en Toma de Equipos`)

  const configs = await prisma.repairConfig.findMany({ where: { activo: true } })
  const config = new Map(configs.map(c => [c.key, c]))

  const trabajos: TrabajoResult[] = []
  let precioTotal = 0
  let horasEstimadas = 0

  for (const it of REPARACIONES_ITEMS) {
    if (!trabajosMarcados[it.key]) continue
    const cfg = config.get(it.key)
    if (!cfg) {
      trabajos.push({ nombre: it.label, precio: null, sinConfigurar: true, motivo: 'Categoría sin configurar' })
      continue
    }
    const descuentoToma = Number((equipo as any)[it.key]) || 0
    if (descuentoToma > 0) {
      const precio = Math.round(descuentoToma * cfg.multiplicador)
      trabajos.push({ nombre: it.label, precio, descuentoToma, multiplicador: cfg.multiplicador })
      precioTotal += precio
      if (cfg.horas > horasEstimadas) horasEstimadas = cfg.horas
      continue
    }
    trabajos.push({ nombre: it.label, precio: null, sinConfigurar: true, motivo: 'Sin precio de Toma de Equipos para este modelo' })
  }

  return { trabajos, precioTotal, horasEstimadas, estado: 'COTIZADO' }
}

/** Arma el tarifario completo: para cada modelo de Toma de Equipos, sus trabajos con precio. */
export async function obtenerTarifario() {
  const equipos = await prisma.priceTradeIn.findMany({ where: { active: true }, orderBy: { orden: 'asc' } })
  const configs = await prisma.repairConfig.findMany({ where: { activo: true } })
  const config = new Map(configs.map(c => [c.key, c]))

  return equipos.map(equipo => {
    const trabajos: TrabajoResult[] = []
    for (const it of REPARACIONES_ITEMS) {
      const cfg = config.get(it.key)
      const descuentoToma = Number((equipo as any)[it.key]) || 0
      if (cfg && descuentoToma > 0) {
        trabajos.push({ nombre: it.label, precio: Math.round(descuentoToma * cfg.multiplicador) })
      } else {
        trabajos.push({ nombre: it.label, precio: null, sinConfigurar: true, motivo: cfg ? 'Sin descuento en Toma' : 'Categoría sin configurar' })
      }
    }
    return { modelo: equipo.modelo, trabajos }
  })
}
