import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
    },
  },
}))

describe('GET /api/orders/track', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 400 when code is missing', async () => {
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/orders/track?email=test@test.com')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('requeridos')
  })

  it('returns 400 when email is missing', async () => {
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/orders/track?code=GP-123')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when order not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/orders/track?code=GP-123&email=test@test.com')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('returns 200 with tracking data when order found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'o1',
      code: 'GP-TEST123',
      status: 'PROCESSING',
      total: 1200000,
      createdAt: new Date(),
      shippingStreet: 'Calle 1',
      shippingNumber: '123',
      shippingFloor: null,
      shippingCity: 'Bahia Blanca',
      shippingProvince: 'Buenos Aires',
      shippingZip: '8000',
      trackingNumber: null,
      trackingUrl: null,
      carrier: null,
      carrierService: null,
      items: [{ quantity: 1, price: 1200000, product: { name: 'iPhone 16 Pro', imageUrl: null, ico: '📱' } }],
    } as any)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/orders/track?code=GP-TEST123&email=test@test.com')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.code).toBe('GP-TEST123')
    expect(data.status).toBe('PROCESSING')
    expect(data.items).toHaveLength(1)
  })
})
