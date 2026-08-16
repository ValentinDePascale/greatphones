import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CbteTipo, CondicionIva, DocTipo, IvaTipo } from '@ramiidv/arca-facturacion'

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const {
  ARCA_CBTE_TYPES,
  netoDesdePrecioConIva,
  buildLineItems,
  resolveReceptor,
  buildFacturarOpts,
  caeExpiryToDate,
} = await import('./arca')

const ITEM = { name: 'iPhone 13', quantity: 1, price: 1210 }

describe('netoDesdePrecioConIva', () => {
  it('extrae el neto gravado de un precio con IVA incluido', () => {
    expect(netoDesdePrecioConIva(1210)).toBe(1000)
    expect(netoDesdePrecioConIva(1000)).toBe(826.45)
  })
})

describe('buildLineItems', () => {
  it('para Factura B genera neto gravado + IVA 21%', () => {
    const items = buildLineItems([ITEM], false)
    expect(items).toEqual([{ neto: 1000, iva: IvaTipo.IVA_21 }])
  })

  it('para Factura C no discrimina IVA', () => {
    const items = buildLineItems([ITEM], true)
    expect(items).toEqual([{ neto: 1210 }])
  })

  it('ignora items con precio cero', () => {
    expect(buildLineItems([{ name: 'Gratis', quantity: 1, price: 0 }], false)).toEqual([])
  })
})

describe('resolveReceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Factura A sin CUIT lanza error', () => {
    expect(() => resolveReceptor('A', {})).toThrow('requiere el CUIT')
  })

  it('Factura A con CUIT usa DocTipo.CUIT y responsable inscripto', () => {
    const r = resolveReceptor('A', { clientCuil: '20-12345678-9' })
    expect(r).toEqual({
      docTipo: DocTipo.CUIT,
      docNro: 20123456789,
      condicionIva: CondicionIva.RESPONSABLE_INSCRIPTO,
    })
  })

  it('Factura B con CUIT lo usa como documento', () => {
    const r = resolveReceptor('B', { clientDni: '20123456789' })
    expect(r.docTipo).toBe(DocTipo.CUIT)
    expect(r.docNro).toBe(20123456789)
  })

  it('Factura B con DNI usa DocTipo.DNI', () => {
    const r = resolveReceptor('B', { clientDni: '30123456' })
    expect(r.docTipo).toBe(DocTipo.DNI)
    expect(r.docNro).toBe(30123456)
  })

  it('Factura B sin documento usa consumidor final', () => {
    const r = resolveReceptor('B', {})
    expect(r).toEqual({
      docTipo: DocTipo.CONSUMIDOR_FINAL,
      docNro: 0,
      condicionIva: CondicionIva.CONSUMIDOR_FINAL,
    })
  })

  it('Factura C usa consumidor final por defecto', () => {
    const r = resolveReceptor('C', { clientCuil: '20123456789' })
    expect(r.docTipo).toBe(DocTipo.CONSUMIDOR_FINAL)
    expect(r.docNro).toBe(0)
  })

  it('aplica overrides de documento cuando se proveen', () => {
    const r = resolveReceptor('C', {}, { docTipo: DocTipo.DNI, docNro: 30123456 })
    expect(r).toEqual({
      docTipo: DocTipo.DNI,
      docNro: 30123456,
      condicionIva: CondicionIva.CONSUMIDOR_FINAL,
    })
  })
})

describe('buildFacturarOpts', () => {
  it('Factura B: calcula neto, IVA y total', () => {
    const built = buildFacturarOpts({
      cbteTipo: 'B',
      items: [ITEM],
      receptor: {},
    })
    expect(built.opts.cbteTipo).toBe(ARCA_CBTE_TYPES.B)
    expect(built.opts.cbteTipo).toBe(CbteTipo.FACTURA_B)
    expect(built.opts.docTipo).toBe(DocTipo.CONSUMIDOR_FINAL)
    expect(built.neto).toBe(1000)
    expect(built.iva).toBe(210)
    expect(built.total).toBe(1210)
  })

  it('Factura C: no calcula IVA', () => {
    const built = buildFacturarOpts({ cbteTipo: 'C', items: [ITEM], receptor: {} })
    expect(built.neto).toBe(1210)
    expect(built.iva).toBe(0)
    expect(built.total).toBe(1210)
  })

  it('Factura A con CUIT propaga documento al comprobante', () => {
    const built = buildFacturarOpts({
      cbteTipo: 'A',
      items: [ITEM],
      receptor: { clientCuil: '20123456789' },
    })
    expect(built.opts.docTipo).toBe(DocTipo.CUIT)
    expect(built.opts.docNro).toBe(20123456789)
    expect(built.opts.condicionIva).toBe(CondicionIva.RESPONSABLE_INSCRIPTO)
  })

  it('Factura A sin CUIT del receptor lanza error', () => {
    expect(() => buildFacturarOpts({ cbteTipo: 'A', items: [ITEM], receptor: {} })).toThrow(
      'requiere el CUIT',
    )
  })
})

describe('caeExpiryToDate', () => {
  it('convierte YYYYMMDD a Date local', () => {
    const d = caeExpiryToDate('20260430')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(30)
  })
})
