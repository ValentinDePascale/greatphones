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
      allowed: rateLimitCallCount <= 5,
      resetAt: new Date(Date.now() + 60000),
    })
  }),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    rateLimitCallCount = 0
    vi.resetModules()
  })

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Email requerido')
  })

  it('returns 400 when password is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when user does not exist', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'noexist@test.com', password: 'test123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with user data on valid credentials', async () => {
    const { prisma } = await import('@/lib/prisma')
    const bcrypt = await import('bcryptjs')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'test@test.com', name: 'Test', password: 'hashed',
      phone: null, dni: null, direccion: null, piso: null, cp: null,
      provincia: null, ciudad: null, role: 'CLIENT', verified: true,
    } as any)
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user.email).toBe('test@test.com')
  })

  it('returns 401 when not verified', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'test@test.com', name: 'Test', password: 'hashed',
      role: 'CLIENT', verified: false,
    } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.needsVerification).toBe(true)
  })

  it('creates user on Google session when not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new1', email: 'google@test.com', name: 'google', role: 'CLIENT',
      phone: null, dni: null, direccion: null, piso: null, cp: null,
      provincia: null, ciudad: null, verified: true,
    } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'google@test.com', _googleSession: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user.email).toBe('google@test.com')
  })
})
