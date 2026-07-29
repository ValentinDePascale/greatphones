import { describe, it, expect, vi, beforeEach } from 'vitest'

let rateLimitCallCount = 0

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockImplementation(() => {
    rateLimitCallCount++
    return Promise.resolve({
      allowed: rateLimitCallCount <= 3,
      resetAt: new Date(Date.now() + 60000),
    })
  }),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    rateLimitCallCount = 0
    vi.resetModules()
  })

  it('returns 400 when required fields are missing (zod validation)', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful account creation', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new1', email: 'new@test.com', name: 'New User',
    } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@test.com',
        name: 'New User',
        password: 'Password123!',
        phone: '1234567890',
        dni: '40123456',
        provincia: 'Buenos Aires',
        ciudad: 'Bahia Blanca',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user.email).toBe('new@test.com')
  })

  it('returns 400 when email already exists', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'exists1', email: 'exists@test.com',
    } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'exists@test.com',
        name: 'Exists',
        password: 'Password123!',
        phone: '1234567890',
        dni: '40123456',
        provincia: 'Buenos Aires',
        ciudad: 'Bahia Blanca',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('registrado')
  })

  it('is rate limited after 3 attempts', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { POST } = await import('./route')
    const makeReq = () =>
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'ratelimit@test.com',
          name: 'RL',
          password: 'Password123!',
          phone: '1234567890',
          dni: '40123456',
          provincia: 'Buenos Aires',
          ciudad: 'Bahia Blanca',
        }),
      })

    await POST(makeReq())
    await POST(makeReq())
    await POST(makeReq())
    const res = await POST(makeReq())
    expect(res.status).toBe(429)
  })
})
