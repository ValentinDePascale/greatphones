import { prisma } from '@/lib/prisma'

/**
 * Configuración de negocio (Fase 5/7): estático clave-valor JSON.
 * Permite editar parámetros sin tocar código (precios de cotización,
 * garantía extendida, envío, regalos, operadores, etc.).
 */
export async function getConfig<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key } })
    if (!row) return fallback
    return (row.value as any) as T
  } catch {
    return fallback
  }
}

export async function setConfig(key: string, value: unknown, updatedBy?: string) {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value: value as any, updatedBy: updatedBy || null },
    create: { key, value: value as any, updatedBy: updatedBy || null },
  })
}

/** Devuelve la configuración de regalos (CONFIG_REGALOS del ERP). */
export interface GiftRule {
  family: string
  accessoryName: string
  accessoryCategory?: string
  mode: 'auto'
}

export async function getGiftRules(): Promise<GiftRule[]> {
  const rules = await getConfig<any[]>('REGALOS', [])
  return Array.isArray(rules) ? rules : []
}

export async function saveGiftRules(rules: GiftRule[], updatedBy?: string) {
  await setConfig('REGALOS', rules, updatedBy)
}

/** Encuentra la regla de regalo cuyo "family" matchea con el nombre del modelo
 *  (prioriza el match más largo). Devuelve null si no hay. */
export function matchGiftRule(rules: GiftRule[], modelName: string): GiftRule | null {
  if (!rules || !rules.length || !modelName) return null
  const name = modelName.toLowerCase()
  let best: GiftRule | null = null
  let bestLen = 0
  for (const r of rules) {
    const fam = (r.family || '').toLowerCase()
    if (fam && name.includes(fam) && fam.length > bestLen) {
      best = r
      bestLen = fam.length
    }
  }
  return best
}