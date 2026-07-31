import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from './prisma'

vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

const { rateLimit, getRateLimitInfo } = await import('./rate-limit')

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows first request and returns remaining', async () => {
    const mockResetAt = new Date(Date.now() + 60000)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(1), resetAt: mockResetAt },
    ])

    const result = await rateLimit('test:user1', 3, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('blocks after exceeding limit', async () => {
    const mockResetAt = new Date(Date.now() + 60000)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(4), resetAt: mockResetAt },
    ])

    const result = await rateLimit('test:user2', 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('allows when exactly at limit', async () => {
    const mockResetAt = new Date(Date.now() + 60000)
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(3), resetAt: mockResetAt },
    ])

    const result = await rateLimit('test:user3', 3, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('tracks different keys independently', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: BigInt(4), resetAt: new Date(Date.now() + 60000) }])
      .mockResolvedValueOnce([{ count: BigInt(1), resetAt: new Date(Date.now() + 60000) }])

    const rA = await rateLimit('test:userA', 3, 60000)
    const rB = await rateLimit('test:userB', 3, 60000)
    expect(rA.allowed).toBe(false)
    expect(rB.allowed).toBe(true)
  })
})

describe('getRateLimitInfo', () => {
  it('returns fresh info for untouched key', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([])

    const info = await getRateLimitInfo('fresh:key', 5, 60000)
    expect(info.count).toBe(0)
    expect(info.remaining).toBe(5)
  })

  it('returns info for expired key as fresh', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(3), expiresAt: new Date(Date.now() - 1000) },
    ])

    const info = await getRateLimitInfo('expired:key', 5, 60000)
    expect(info.count).toBe(0)
    expect(info.remaining).toBe(5)
  })

  it('returns current count for active key', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(2), expiresAt: new Date(Date.now() + 30000) },
    ])

    const info = await getRateLimitInfo('active:key', 5, 60000)
    expect(info.count).toBe(2)
    expect(info.remaining).toBe(3)
  })
})
