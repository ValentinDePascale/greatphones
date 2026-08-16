import { describe, it, expect, beforeAll } from 'vitest'
import { isAllowedRequestOrigin, isMutatingRequest } from './request-guard'

// En este archivo de test queremos probar la lógica REAL de CSRF,
// no el bypass. Por eso desactivamos el bypass solo acá.
const originalBypass = process.env.BYPASS_CSRF
beforeAll(() => {
  delete process.env.BYPASS_CSRF
})

function makeRequest(origin?: string, referer?: string, method = 'GET') {
  const headers = new Headers()
  if (origin) headers.set('Origin', origin)
  if (referer) headers.set('Referer', referer)
  if (method) headers.set('X-HTTP-Method-Override', method)
  return { headers }
}

describe('request-guard', () => {
  it('allows requests from an allowed origin', () => {
    expect(isAllowedRequestOrigin(makeRequest('https://greatphones.com.ar'))).toBe(true)
  })

  it('rejects requests from a disallowed origin', () => {
    expect(isAllowedRequestOrigin(makeRequest('https://evil.example.com'))).toBe(false)
  })

  it('allows requests with no origin but an allowed referer (GET)', () => {
    expect(isAllowedRequestOrigin(makeRequest(undefined, 'https://greatphones.com.ar/checkout'))).toBe(true)
  })

  it('rejects POST with no origin and a disallowed referer', () => {
    expect(isAllowedRequestOrigin(makeRequest(undefined, 'https://evil.example.com/page', 'POST'))).toBe(false)
  })

  it('rejects POST with no origin and no referer (CSRF protection)', () => {
    expect(isAllowedRequestOrigin(makeRequest(undefined, undefined, 'POST'))).toBe(false)
  })

  it('allows GET with no origin and no referer (link previews, curl)', () => {
    expect(isAllowedRequestOrigin(makeRequest(undefined, undefined, 'GET'))).toBe(true)
  })

  it('rejects malformed referer values on POST', () => {
    expect(isAllowedRequestOrigin(makeRequest(undefined, 'not a url', 'POST'))).toBe(false)
  })

  it('treats GET as non-mutating and POST/PUT/PATCH/DELETE as mutating', () => {
    expect(isMutatingRequest('GET')).toBe(false)
    expect(isMutatingRequest('POST')).toBe(true)
    expect(isMutatingRequest('PATCH')).toBe(true)
    expect(isMutatingRequest('delete')).toBe(true)
  })
})
