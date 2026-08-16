import crypto from 'crypto'

/**
 * Constant-time string comparison to prevent timing attacks on OTP/secret validation.
 * Both strings are normalized to the same length before comparison so the runtime
 * does not leak the length of the stored value.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  const maxLen = Math.max(aBuf.length, bBuf.length)
  const aPadded = Buffer.alloc(maxLen)
  const bPadded = Buffer.alloc(maxLen)
  aBuf.copy(aPadded)
  bBuf.copy(bPadded)
  return crypto.timingSafeEqual(aPadded, bPadded)
}
