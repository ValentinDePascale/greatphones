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
})
