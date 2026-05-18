import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, getRateLimitInfo } from './rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    ;(global as any).__RATE_LIMIT_STORE__?.clear?.()
  })

  it('allows requests within the limit', () => {
    const r1 = rateLimit('test:user1', 3, 60000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit('test:user1', 3, 60000)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = rateLimit('test:user1', 3, 60000)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests after exceeding the limit', () => {
    rateLimit('test:user2', 2, 60000)
    rateLimit('test:user2', 2, 60000)
    const blocked = rateLimit('test:user2', 2, 60000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('tracks different keys independently', () => {
    rateLimit('test:userA', 1, 60000)
    const rA = rateLimit('test:userA', 1, 60000)
    expect(rA.allowed).toBe(false)

    const rB = rateLimit('test:userB', 1, 60000)
    expect(rB.allowed).toBe(true)
  })
})

describe('getRateLimitInfo', () => {
  it('returns correct info for untouched key', () => {
    const info = getRateLimitInfo('fresh:key', 5, 60000)
    expect(info.count).toBe(0)
    expect(info.remaining).toBe(5)
  })

  it('returns correct info after some requests', () => {
    rateLimit('info:key', 5, 60000)
    rateLimit('info:key', 5, 60000)
    const info = getRateLimitInfo('info:key', 5, 60000)
    expect(info.count).toBe(2)
    expect(info.remaining).toBe(3)
  })
})
