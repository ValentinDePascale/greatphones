import { prisma } from '@/lib/prisma'
import { productCache, accessoryCache } from '@/lib/cache'

const SWEEP_INTERVAL_MS = 60_000
let lastSweepAt = 0

/**
 * Auto-expire offers whose offerEnd has passed.
 *
 * Runs at most once per SWEEP_INTERVAL_MS to avoid hammering the DB on every
 * public GET. Both Product and Accessory are swept.
 *
 * Clears the in-memory product/accessory caches when any rows are updated so
 * the next request returns the fresh state.
 */
export async function expireOffers(): Promise<{ products: number; accessories: number }> {
  if (Date.now() - lastSweepAt < SWEEP_INTERVAL_MS) {
    return { products: 0, accessories: 0 }
  }
  lastSweepAt = Date.now()

  const now = new Date()

  const [productsResult, accessoriesResult] = await Promise.all([
    prisma.product.updateMany({
      where: {
        isOffer: true,
        offerEnd: { not: null, lt: now },
      },
      data: { isOffer: false, discount: 0 },
    }),
    prisma.accessory.updateMany({
      where: {
        isOffer: true,
        offerEnd: { not: null, lt: now },
      },
      data: { isOffer: false, discount: 0 },
    }),
  ])

  if (productsResult.count > 0) productCache.clear()
  if (accessoriesResult.count > 0) accessoryCache.clear()

  if (productsResult.count > 0 || accessoriesResult.count > 0) {
    console.log(
      `[expireOffers] expired products=${productsResult.count} accessories=${accessoriesResult.count}`
    )
  }

  return {
    products: productsResult.count,
    accessories: accessoriesResult.count,
  }
}
