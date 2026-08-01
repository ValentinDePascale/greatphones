/**
 * Shared pricing and order utility functions.
 */

export function getEffectivePrice(product: { price: number; isOffer?: boolean; discount?: number | null; offerStart?: Date | string | null; offerEnd?: Date | string | null }): number {
  if (product.isOffer && product.discount && product.discount > 0) {
    const now = new Date()
    const start = product.offerStart ? new Date(product.offerStart) : null
    const end = product.offerEnd ? new Date(product.offerEnd) : null
    if ((!start || start <= now) && (!end || end >= now)) {
      return Math.round(product.price * (1 - product.discount / 100))
    }
  }
  return product.price
}

export function generateOrderCode(): string {
  const prefix = 'GP'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export { WARRANTY_COST_MAP } from '@/config'
