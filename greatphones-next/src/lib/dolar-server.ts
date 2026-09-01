import { prisma } from '@/lib/prisma'
import { obtenerDolar, type DolarApiResponse, type DolarTipo } from '@/lib/precios'

/**
 * Cotización efectiva del dólar para usar en cálculos del negocio (Ventas,
 * Preventas, Dashboard, Historial, etc.): prioriza el override manual que
 * carga el admin en Precios → Lista de Precios (AppConfig 'dolar_override'),
 * y solo si no hay override cae a la API en vivo, y si esa también falla a
 * un default fijo. Misma prioridad que ya usaba GET /api/admin/precios/dolar.
 *
 * Server-only (importa Prisma): no importar desde componentes cliente.
 */
export async function dolarActual(tipo: DolarTipo = 'blue'): Promise<DolarApiResponse> {
  const override = await prisma.appConfig.findUnique({ where: { key: 'dolar_override' } })
  if (override?.value && typeof override.value === 'object' && 'venta' in override.value) {
    const v = override.value as any
    return { venta: v.venta, compra: v.compra || v.venta, fecha: v.fecha, fuente: 'manual' }
  }

  const dolar = await obtenerDolar(tipo)
  if (dolar) return dolar

  return { venta: 1000, compra: 950, fecha: new Date().toISOString(), fuente: 'default (API indisponible)' }
}
