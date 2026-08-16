import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/cache', () => ({
  productCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clear: vi.fn(),
  },
}))

vi.mock('@/lib/auth-guard', () => ({
  requireAdmin: vi.fn(),
  handleRouteError: vi.fn((e) => {
    const status = e?.status || 500
    return new Response(JSON.stringify({ error: e?.message || 'Error interno' }), { status, headers: { 'Content-Type': 'application/json' } })
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 30, resetAt: Date.now() + 60000 }),
  safeKeyPart: (v: string) => v,
  clientIpKey: (req: Request) => req.headers.get('x-forwarded-for') || 'unknown',
}))

vi.mock('@/lib/expire-offers', () => ({
  expireOffers: vi.fn().mockResolvedValue({ products: 0, accessories: 0 }),
}))

vi.mock('@/lib/validations', async () => {
  const original = await vi.importActual('@/lib/validations')
  return original
})

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 200 with product list', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.product.count).mockResolvedValue(2)
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: '1', name: 'iPhone 16 Pro', brand: 'Apple', price: 1200000, stock: 5 },
      { id: '2', name: 'iPhone 15', brand: 'Apple', price: 800000, stock: 3 },
    ] as any)

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toHaveLength(2)
    expect(data.total).toBe(2)
  })

  it('filters by brand', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.product.count).mockResolvedValue(1)
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: '1', name: 'iPhone 16 Pro', brand: 'Apple', price: 1200000, stock: 5 },
    ] as any)

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/products?brand=Apple')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toHaveLength(1)
  })

  it('returns empty list when no products match', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.product.count).mockResolvedValue(0)
    vi.mocked(prisma.product.findMany).mockResolvedValue([])

    const { GET } = await import('./route')
    const req = new NextRequest('http://localhost/api/products?search=nonexistent')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toHaveLength(0)
    expect(data.total).toBe(0)
  })
})
