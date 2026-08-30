import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch'

describe('useSearch', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@email.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com' },
    { id: 3, name: 'Johnny Walker', email: 'johnny@email.com' },
  ]

  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useSearch(mockUsers))

    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual(mockUsers)
    expect(result.current.isSearching).toBe(false)
    expect(result.current.hasResults).toBe(true)
  })

  it('debe buscar en múltiples campos', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['name', 'email'] }),
    )

    act(() => {
      result.current.setQuery('john')
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results[0].name).toBe('John Doe')
    expect(result.current.results[1].name).toBe('Johnny Walker')
  })

  it('debe ser case-insensitive por defecto', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['name'] }),
    )

    act(() => {
      result.current.setQuery('JOHN')
    })

    expect(result.current.results).toHaveLength(2)
  })

  it('debe respetar caseSensitive cuando es true', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['name'], caseSensitive: true }),
    )

    act(() => {
      result.current.setQuery('John Doe')
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].name).toBe('John Doe')

    act(() => {
      result.current.setQuery('john')
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].name).toBe('Johnny Walker')
  })

  it('debe respetar minChars', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['name'], minChars: 3 }),
    )

    act(() => {
      result.current.setQuery('jo')
    })

    expect(result.current.isSearching).toBe(false)
    expect(result.current.results).toEqual(mockUsers)

    act(() => {
      result.current.setQuery('john')
    })

    expect(result.current.isSearching).toBe(true)
    expect(result.current.matchCount).toBe(2)
  })

  it('debe contar resultados correctamente', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['email'] }),
    )

    act(() => {
      result.current.setQuery('email.com')
    })

    expect(result.current.matchCount).toBe(3)
  })

  it('debe limpiar búsqueda con clear()', () => {
    const { result } = renderHook(() =>
      useSearch(mockUsers, { searchFields: ['name'] }),
    )

    act(() => {
      result.current.setQuery('john')
    })

    expect(result.current.query).toBe('john')

    act(() => {
      result.current.clear()
    })

    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual(mockUsers)
  })

  it('debe llamar onSearchChange callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useSearch(mockUsers, { onSearchChange: callback }),
    )

    act(() => {
      result.current.setQuery('john')
    })

    expect(callback).toHaveBeenCalledWith('john')
  })
})
