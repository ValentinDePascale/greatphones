import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from './prisma'

vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

const { rateLimit, getRateLimitInfo, clientIpKey, safeKeyPart } = await import('./rate-limit')

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

describe('clientIpKey', () => {
  it('handles IPv4-mapeada-IPv6 (::ffff:127.0.0.1)', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '::ffff:127.0.0.1' },
    })
    expect(clientIpKey(req)).toBe('127.0.0.1')
  })

  it('handles plain IPv4', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.0.5' },
    })
    expect(clientIpKey(req)).toBe('192.168.0.5')
  })

  it('handles IPv6 loopback', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '::1' },
    })
    expect(clientIpKey(req)).toBe('::1')
  })

  it('handles full IPv6 address', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
    })
    expect(clientIpKey(req)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(clientIpKey(req)).toBe('10.0.0.1')
  })

  it('returns "unknown" when no IP headers present', () => {
    const req = new Request('http://localhost')
    expect(clientIpKey(req)).toBe('unknown')
  })

  it('takes first hop from comma-separated x-forwarded-for chain', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 10.0.0.1' },
    })
    expect(clientIpKey(req)).toBe('203.0.113.1')
  })
})

describe('rateLimit keys with IPs (regression: bug 500s)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { count: BigInt(1), resetAt: new Date(Date.now() + 60000) },
    ])
  })

  it('accepts keys with IPv4 (with dots)', async () => {
    await expect(rateLimit('products:127.0.0.1', 5, 60000)).resolves.toBeDefined()
  })

  it('accepts keys with IPv4-mapeada-IPv6', async () => {
    await expect(rateLimit('products:::ffff:127.0.0.1', 5, 60000)).resolves.toBeDefined()
  })

  it('accepts keys with full IPv6', async () => {
    await expect(rateLimit('products:::1', 5, 60000)).resolves.toBeDefined()
  })

  it('still rejects keys with @ (email-like)', async () => {
    await expect(rateLimit('products:foo@bar.com', 5, 60000)).rejects.toThrow(/Invalid rate-limit key/)
  })

  it('still rejects keys with spaces', async () => {
    await expect(rateLimit('products:hello world', 5, 60000)).rejects.toThrow(/Invalid rate-limit key/)
  })

  it('still rejects keys exceeding max length', async () => {
    const longKey = 'a'.repeat(200)
    await expect(rateLimit(`products:${longKey}`, 5, 60000)).rejects.toThrow(/Invalid rate-limit key/)
  })
})

describe('safeKeyPart', () => {
  it('returns value as-is when safe', () => {
    expect(safeKeyPart('user123')).toBe('user123')
    expect(safeKeyPart('192.168.0.1')).toBe('192.168.0.1')
    expect(safeKeyPart('::1')).toBe('::1')
  })

  it('hashes emails (with @)', () => {
    const result = safeKeyPart('user@example.com')
    expect(result).not.toContain('@')
    expect(result).toMatch(/^[a-f0-9]{32}$/)
  })

  it('returns "anon" for empty/null', () => {
    expect(safeKeyPart(null)).toBe('anon')
    expect(safeKeyPart(undefined)).toBe('anon')
    expect(safeKeyPart('')).toBe('anon')
  })

  it('normalizes case (lowercases before hashing)', () => {
    const a = safeKeyPart('User@Example.com')
    const b = safeKeyPart('user@example.com')
    expect(a).toBe(b)
  })
})
