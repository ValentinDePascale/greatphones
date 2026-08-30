import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('debe inicializar con loading = true si immediate es true', () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
    const { result } = renderHook(() => useAsync(mockFetch, true))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('debe cargar datos correctamente', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: 'John' })
    const { result } = renderHook(() => useAsync(mockFetch))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ id: 1, name: 'John' })
    expect(result.current.error).toBeNull()
  })

  it('debe manejar errores', async () => {
    const testError = new Error('Test error')
    const mockFetch = vi.fn().mockRejectedValue(testError)
    const { result } = renderHook(() => useAsync(mockFetch))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error?.message).toBe('Test error')
  })

  it('debe no ejecutar si immediate es false', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
    const { result } = renderHook(() => useAsync(mockFetch, false))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
  })

  it('debe executar manualmente con retry()', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
    const { result } = renderHook(() => useAsync(mockFetch, false))

    act(() => {
      result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: 'test' })
  })

  it('debe re-ejecutar cuando las dependencias cambian', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ id: 1 })
    let dep = 1

    const { result, rerender } = renderHook(
      ({ dependency }) => useAsync(() => Promise.resolve({ id: dependency }), true, [dependency]),
      { initialProps: { dependency: dep } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ id: 1 })

    dep = 2
    rerender({ dependency: dep })

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 })
    })
  })
})
