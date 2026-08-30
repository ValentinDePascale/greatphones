import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }))

  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => usePagination(mockData))

    expect(result.current.currentPage).toBe(1)
    expect(result.current.itemsPerPage).toBe(10)
    expect(result.current.totalItems).toBe(100)
    expect(result.current.totalPages).toBe(10)
  })

  it('debe paginar correctamente', () => {
    const { result } = renderHook(() => usePagination(mockData))

    expect(result.current.paginatedItems).toHaveLength(10)
    expect(result.current.paginatedItems[0].id).toBe(1)
    expect(result.current.paginatedItems[9].id).toBe(10)
  })

  it('debe navegar a la siguiente página', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.paginatedItems[0].id).toBe(11)
  })

  it('debe navegar a la página anterior', () => {
    const { result } = renderHook(() => usePagination(mockData, { initialPage: 3 }))

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('debe ir a una página específica', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.goToPage(5)
    })

    expect(result.current.currentPage).toBe(5)
    expect(result.current.paginatedItems[0].id).toBe(41)
  })

  it('debe validar página mínima (1)', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.goToPage(0)
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('debe validar página máxima', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.goToPage(999)
    })

    expect(result.current.currentPage).toBe(10)
  })

  it('debe cambiar items por página', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.setItemsPerPage(25)
    })

    expect(result.current.itemsPerPage).toBe(25)
    expect(result.current.totalPages).toBe(4)
    expect(result.current.paginatedItems).toHaveLength(25)
  })

  it('debe volver a página 1 cuando cambia items por página', () => {
    const { result } = renderHook(() => usePagination(mockData))

    act(() => {
      result.current.goToPage(5)
    })

    act(() => {
      result.current.setItemsPerPage(25)
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('debe indicar si hay página anterior/siguiente', () => {
    const { result } = renderHook(() => usePagination(mockData))

    expect(result.current.hasPrevPage).toBe(false)
    expect(result.current.hasNextPage).toBe(true)

    act(() => {
      result.current.goToPage(10)
    })

    expect(result.current.hasPrevPage).toBe(true)
    expect(result.current.hasNextPage).toBe(false)
  })

  it('debe calcular índices de inicio/fin correctamente', () => {
    const { result } = renderHook(() => usePagination(mockData))

    expect(result.current.startIndex).toBe(1)
    expect(result.current.endIndex).toBe(10)

    act(() => {
      result.current.goToPage(5)
    })

    expect(result.current.startIndex).toBe(41)
    expect(result.current.endIndex).toBe(50)
  })
})
