import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    passwordReset: { create: vi.fn() },
  },
}))

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}))

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns success message even when user does not exist (no enumeration)', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@test.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toBe('Si el email existe, recibiras un codigo')
  })

  it('is rate limited after 3 attempts', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', email: 'ratelimit@test.com' } as any)

    const { POST } = await import('./route')
    const makeReq = () =>
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'ratelimit@test.com' }),
      })

    await POST(makeReq())
    await POST(makeReq())
    await POST(makeReq())
    const res = await POST(makeReq())
    expect(res.status).toBe(429)
  })
})
