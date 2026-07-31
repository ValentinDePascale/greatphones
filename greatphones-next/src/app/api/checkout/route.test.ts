import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    product: { findMany: vi.fn() },
    accessory: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
    order: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    coupon: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }), findUnique: vi.fn().mockResolvedValue({ remainingAmount: 0 }) },
    orderCoupon: { create: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([{ count: BigInt(0), resetAt: new Date(Date.now() + 60000) }]),
    $transaction: vi.fn((fn) => fn({
      product: { update: vi.fn().mockResolvedValue({ stock: 4, reserved: 1 }) },
      accessory: { update: vi.fn().mockResolvedValue({ stock: 4, reserved: 1 }) },
      order: { create: vi.fn().mockResolvedValue({ id: 'o1', code: 'GP-TEST', status: 'PENDING', payment: 'mercadopago', total: 1200000, warrantyCost: 0, deliveryCost: 0, subtotal: 1200000 }) },
      orderCoupon: { create: vi.fn() },
      coupon: { update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }), findUnique: vi.fn().mockResolvedValue({ remainingAmount: 0 }) },
      paymentTransaction: { create: vi.fn(), updateMany: vi.fn() },
    })),
  },
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn(function(this: any) {
    this.create = vi.fn().mockResolvedValue({ id: 'pref_123', init_point: 'https://mp.com/pay' })
  }),
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
    const res = await POST(req as any)
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
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when product stock is insufficient', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'user1', email: 'test@test.com' } as any)
    vi.mocked(prisma.product.findMany).mockResolvedValue([{ id: '1', stock: 0 }] as any)

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
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Stock insuficiente')
  })

  it('returns 200 with preferenceId on successful checkout', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'user1', email: 'test@test.com', name: 'Test' } as any)
    vi.mocked(prisma.product.findMany).mockResolvedValue([{
      id: '1', name: 'iPhone 16 Pro', brand: 'Apple', sub: '',
      price: 1200000, stock: 5, imageUrl: null, isOffer: false, discount: 0,
    }] as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: '1', name: 'iPhone 16 Pro', price: 1200000, quantity: 1 }],
        email: 'test@test.com',
        phone: '1234567890',
        document: '40123456',
        street: 'Calle',
        number: '123',
        zip: '8000',
        city: 'Bahia Blanca',
        province: 'Buenos Aires',
        subtotal: 1200000,
        total: 1200000,
        paymentMethod: 'mercadopago',
        warranty: '90 días',
        delivery: 'Estandar',
        deliveryCost: 0,
        cuotas: 1,
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.preferenceId).toBe('pref_123')
    expect(data.orderCode).toBeDefined()
  })
})
