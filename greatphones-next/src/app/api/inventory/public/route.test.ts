import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 60, resetAt: Date.now() + 60000 }),
  clientIpKey: () => '127.0.0.1',
}))

describe('GET /api/inventory/public', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when productId is missing', async () => {
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    const rateLimit = await import('@/lib/rate-limit')
    vi.mocked(rateLimit.rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    })
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=abc')
    const res = await GET(req)
    expect(res.status).toBe(429)
  })

  it('returns only safe fields (no IMEI, no purchasePrice)', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([
      {
        id: 'inv1',
        code: 'CMP-001',
        status: 'IN_STOCK',
        targetPrice: 500000,
        salePrice: null,
        storage: '128 GB',
        color: 'Negro',
        cosmeticCondition: 'Impecable',
        batteryHealth: 95,
        imageUrl: 'https://example.com/img.jpg',
        productId: 'prod1',
      },
    ] as any)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verifica campos seguros
    expect(body.data[0]).toHaveProperty('id', 'inv1')
    expect(body.data[0]).toHaveProperty('code', 'CMP-001')
    expect(body.data[0]).toHaveProperty('targetPrice', 500000)
    expect(body.data[0]).toHaveProperty('storage', '128 GB')

    // Verifica que NO expone IMEI ni datos sensibles
    expect(body.data[0]).not.toHaveProperty('imei')
    expect(body.data[0]).not.toHaveProperty('serialNumber')
    expect(body.data[0]).not.toHaveProperty('purchasePrice')
    expect(body.data[0]).not.toHaveProperty('purchaseDate')
    expect(body.data[0]).not.toHaveProperty('supplierId')
    expect(body.data[0]).not.toHaveProperty('investor')
    expect(body.data[0]).not.toHaveProperty('soldById')
    expect(body.data[0]).not.toHaveProperty('createdById')
    expect(body.data[0]).not.toHaveProperty('notes')
  })

  it('excludes SOLD items from results', async () => {
    const { prisma } = await import('@/lib/prisma')
    const mockFindMany = vi.mocked(prisma.inventoryItem.findMany)
    mockFindMany.mockResolvedValue([])

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1')
    await GET(req)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'SOLD' },
        }),
      })
    )
  })

  it('caps limit at 100 to prevent DoS', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1&limit=999999')
    await GET(req)

    const { prisma: p } = await import('@/lib/prisma')
    expect(p.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it('uses default limit of 50 when not specified', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1')
    await GET(req)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    )
  })

  it('returns 500 on database error', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.inventoryItem.findMany).mockRejectedValue(new Error('DB down'))

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('sets cache headers for CDN', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/inventory/public?productId=prod1')
    const res = await GET(req)
    expect(res.headers.get('cache-control')).toContain('public')
    expect(res.headers.get('cache-control')).toContain('max-age')
  })
})
