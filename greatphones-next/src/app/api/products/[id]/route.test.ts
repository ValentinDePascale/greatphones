import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-guard', () => ({
  requireAdmin: vi.fn(),
}))

describe('GET /api/products/[id]', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 200 with product when found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'p1', name: 'iPhone 16 Pro', brand: 'Apple', price: 1200000, stock: 5,
    } as any)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/products/p1')
    const res = await GET(req, { params: Promise.resolve({ id: 'p1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('iPhone 16 Pro')
  })

  it('returns 404 when product not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/products/p999')
    const res = await GET(req, { params: Promise.resolve({ id: 'p999' }) })
    expect(res.status).toBe(404)
  })
})
