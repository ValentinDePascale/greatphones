import { describe, it, expect } from 'vitest'
import { WalletPaySchema, CheckoutSchema, ArrepentimientoSchema } from './validations'

describe('plainText hardening', () => {
  it("rejects '<' in checkout street", () => {
    const result = CheckoutSchema.safeParse({
      items: [{ id: 'p1', name: 'iPhone', price: 100, quantity: 1 }],
      email: 'a@b.com',
      document: '12345678',
      street: '<img src=x onerror=alert(1)>',
      number: '123',
      zip: '1000',
      city: 'CABA',
      province: 'Buenos Aires',
      subtotal: 100,
      total: 100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects '>' in arrepentimiento motivo", () => {
    const result = ArrepentimientoSchema.safeParse({
      orderId: 'o1',
      email: 'a@b.com',
      motivo: 'No me gusta > gracias',
    })
    expect(result.success).toBe(false)
  })

  it('accepts normal text checkout', () => {
    const result = CheckoutSchema.safeParse({
      items: [{ id: 'p1', name: 'iPhone', price: 100, quantity: 1 }],
      email: 'a@b.com',
      document: '12345678',
      street: 'Av Siempre Viva',
      number: '742',
      zip: '1000',
      city: 'CABA',
      province: 'Buenos Aires',
      subtotal: 100,
      total: 100,
    })
    expect(result.success).toBe(true)
  })
})

describe('WalletPaySchema', () => {
  it('rejects a negative quantity', () => {
    const result = WalletPaySchema.safeParse({
      items: [{ id: 'p1', quantity: -2 }],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer quantity', () => {
    const result = WalletPaySchema.safeParse({
      items: [{ id: 'p1', quantity: 2.5 }],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a zero quantity', () => {
    const result = WalletPaySchema.safeParse({
      items: [{ id: 'p1', quantity: 0 }],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an excessive quantity', () => {
    const result = WalletPaySchema.safeParse({
      items: [{ id: 'p1', quantity: 100 }],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty items array', () => {
    const result = WalletPaySchema.safeParse({
      items: [],
      total: 0,
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid payload with an optional imei', () => {
    const result = WalletPaySchema.safeParse({
      items: [{ id: 'p1', name: 'iPhone', quantity: 1, imei: '123456789012345' }],
      email: 'a@b.com',
      cuotas: 1,
      total: 1000,
    })
    expect(result.success).toBe(true)
  })
})
