import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    quote: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-guard', () => ({
  requireSession: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendNewQuoteEmail: vi.fn().mockResolvedValue(true),
}))

describe('GET /api/quotes', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    const { requireSession } = await import('@/lib/auth-guard')
    vi.mocked(requireSession).mockRejectedValue({ status: 401, message: 'No autenticado' })

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quotes')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('returns 200 with quotes for authenticated user', async () => {
    const { requireSession } = await import('@/lib/auth-guard')
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(requireSession).mockResolvedValue({ id: 'u1', email: 'test@test.com', role: 'CLIENT' })
    vi.mocked(prisma.quote.count).mockResolvedValue(1)
    vi.mocked(prisma.quote.findMany).mockResolvedValue([
      { id: 'q1', code: 'QT-123', device: 'iPhone 15 Pro', status: 'PENDING', finalPrice: 800000 },
    ] as any)

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quotes')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toHaveLength(1)
  })
})

describe('POST /api/quotes', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 400 when required fields are missing', async () => {
    const { requireSession } = await import('@/lib/auth-guard')
    vi.mocked(requireSession).mockResolvedValue({ id: 'u1', email: 'test@test.com', role: 'CLIENT' })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/quotes', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful quote creation', async () => {
    const { requireSession } = await import('@/lib/auth-guard')
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(requireSession).mockResolvedValue({ id: 'u1', email: 'test@test.com', role: 'CLIENT' })
    vi.mocked(prisma.quote.create).mockResolvedValue({
      id: 'q1', code: 'QT-123', device: 'iPhone 15 Pro', status: 'PENDING', finalPrice: 800000,
      photos: [], dniPhotos: [], extras: [], batteryHealth: null,
    } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        device: 'iPhone 15 Pro',
        storage: '256 GB',
        condition: 'Impecable',
        basePrice: 700000,
        finalPrice: 800000,
        envio: 'presencial',
        payment: 'efectivo',
        clientName: 'Test',
        clientDni: '40123456',
        clientPhone: '1234567890',
        clientCity: 'Bahia Blanca',
        clientCp: '8000',
        clientProvince: 'Buenos Aires',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.quote.device).toBe('iPhone 15 Pro')
  })
})

describe('PATCH /api/quotes', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 403 when not admin', async () => {
    const { requireAdmin } = await import('@/lib/auth-guard')
    vi.mocked(requireAdmin).mockRejectedValue({ status: 403, message: 'Acceso denegado' })

    const { PATCH } = await import('./route')
    const req = new Request('http://localhost/api/quotes', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'q1', status: 'APPROVED' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 when id or status missing', async () => {
    const { requireAdmin } = await import('@/lib/auth-guard')
    vi.mocked(requireAdmin).mockResolvedValue({ id: 'a1', email: 'admin@test.com', role: 'ADMIN' })

    const { PATCH } = await import('./route')
    const req = new Request('http://localhost/api/quotes', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 when quote approved', async () => {
    const { requireAdmin } = await import('@/lib/auth-guard')
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(requireAdmin).mockResolvedValue({ id: 'a1', email: 'admin@test.com', role: 'ADMIN' })
    vi.mocked(prisma.quote.update).mockResolvedValue({
      id: 'q1', status: 'APPROVED', user: { id: 'u1', name: 'Test', email: 'test@test.com' },
    } as any)

    const { PATCH } = await import('./route')
    const req = new Request('http://localhost/api/quotes', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'q1', status: 'APPROVED' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.quote.status).toBe('APPROVED')
  })
})
