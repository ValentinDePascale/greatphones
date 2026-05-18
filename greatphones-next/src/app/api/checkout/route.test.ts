import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    product: { findUnique: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn((fn) => fn({ product: { update: vi.fn() }, order: { create: vi.fn() } })),
  },
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: 'pref_123', init_point: 'https://mp.com/pay' }),
  })),
}))

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 400 when cart is empty', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [],
        email: 'test@test.com',
        document: '12345678',
        street: 'Calle',
        number: '123',
        zip: '8000',
        city: 'Bahia Blanca',
        province: 'Buenos Aires',
        subtotal: 0,
        total: 0,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: '1', name: 'Test', price: 100, quantity: 1 }],
        email: 'invalid',
        document: '12345678',
        street: 'Calle',
        number: '123',
        zip: '8000',
        city: 'Bahia Blanca',
        province: 'Buenos Aires',
        subtotal: 100,
        total: 100,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when product stock is insufficient', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'user1', email: 'test@test.com' })
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: '1', stock: 0 })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: '1', name: 'Test', price: 100, quantity: 1 }],
        email: 'test@test.com',
        document: '12345678',
        street: 'Calle',
        number: '123',
        zip: '8000',
        city: 'Bahia Blanca',
        province: 'Buenos Aires',
        subtotal: 100,
        total: 100,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Stock insuficiente')
  })
})
