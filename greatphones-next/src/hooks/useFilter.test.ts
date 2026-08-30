import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilter } from './useFilter'

describe('useFilter', () => {
  const mockOrders = [
    { id: 1, status: 'PENDING', price: 100, tags: ['new', 'urgent'] },
    { id: 2, status: 'SHIPPED', price: 200, tags: ['express'] },
    { id: 3, status: 'DELIVERED', price: 150, tags: ['new'] },
    { id: 4, status: 'PENDING', price: 300, tags: ['urgent'] },
  ]

  it('debe inicializar sin filtros', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    expect(result.current.filters).toHaveLength(0)
    expect(result.current.results).toEqual(mockOrders)
    expect(result.current.hasFilters).toBe(false)
    expect(result.current.matchCount).toBe(4)
  })

  it('debe filtrar con equals', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results.every(o => o.status === 'PENDING')).toBe(true)
  })

  it('debe filtrar con includes (para arrays)', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'tags', value: ['urgent'] })
    })

    expect(result.current.results).toHaveLength(2)
  })

  it('debe filtrar con startsWith', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PEN', operator: 'startsWith' })
    })

    expect(result.current.results).toHaveLength(2)
  })

  it('debe filtrar con greaterThan', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'price', value: 150, operator: 'greaterThan' })
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results.every(o => o.price > 150)).toBe(true)
  })

  it('debe filtrar con lessThan', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'price', value: 200, operator: 'lessThan' })
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results.every(o => o.price < 200)).toBe(true)
  })

  it('debe aplicar múltiples filtros (AND)', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
      result.current.addFilter({ field: 'price', value: 200, operator: 'greaterThan' })
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].id).toBe(4)
  })

  it('debe actualizar filtro existente', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
    })

    expect(result.current.results).toHaveLength(2)

    act(() => {
      result.current.updateFilter('status', 'SHIPPED')
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].status).toBe('SHIPPED')
  })

  it('debe remover filtro específico', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
      result.current.addFilter({ field: 'price', value: 50, operator: 'greaterThan' })
    })

    expect(result.current.results).toHaveLength(2)

    act(() => {
      result.current.removeFilter('status')
    })

    expect(result.current.results).toHaveLength(4)
  })

  it('debe limpiar todos los filtros', () => {
    const { result } = renderHook(() => useFilter(mockOrders))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
      result.current.addFilter({ field: 'price', value: 200, operator: 'greaterThan' })
    })

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toHaveLength(0)
    expect(result.current.results).toEqual(mockOrders)
    expect(result.current.hasFilters).toBe(false)
  })

  it('debe llamar onFiltersChange callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useFilter(mockOrders, { onFiltersChange: callback }))

    act(() => {
      result.current.addFilter({ field: 'status', value: 'PENDING' })
    })

    expect(callback).toHaveBeenCalled()
  })
})
