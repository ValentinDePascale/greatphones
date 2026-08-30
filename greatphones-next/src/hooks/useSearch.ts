import { useState, useMemo, useCallback } from 'react'

export interface UseSearchOptions<T> {
  searchFields?: (keyof T)[]
  caseSensitive?: boolean
  minChars?: number
  onSearchChange?: (query: string) => void
}

export interface UseSearchReturn<T> {
  query: string
  setQuery: (query: string) => void
  clear: () => void
  results: T[]
  hasResults: boolean
  isSearching: boolean
  matchCount: number
}

export function useSearch<T extends Record<string, any>>(
  items: T[],
  options: UseSearchOptions<T> = {},
): UseSearchReturn<T> {
  const {
    searchFields = Object.keys(items[0] || {}) as (keyof T)[],
    caseSensitive = false,
    minChars = 1,
    onSearchChange,
  } = options

  const [query, setQuery] = useState('')

  const { results, matchCount, isSearching } = useMemo(() => {
    const q = query.trim()
    const isSearching = q.length >= minChars

    if (!isSearching) {
      return { results: items, matchCount: 0, isSearching: false }
    }

    const searchQuery = caseSensitive ? q : q.toLowerCase()

    const filtered = items.filter(item => {
      return searchFields.some(field => {
        const fieldValue = String(item[field] ?? '')
        const value = caseSensitive ? fieldValue : fieldValue.toLowerCase()
        return value.includes(searchQuery)
      })
    })

    return {
      results: filtered,
      matchCount: filtered.length,
      isSearching: true,
    }
  }, [query, items, searchFields, caseSensitive, minChars])

  const handleSetQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)
      onSearchChange?.(newQuery)
    },
    [onSearchChange],
  )

  const clear = useCallback(() => {
    handleSetQuery('')
  }, [handleSetQuery])

  return {
    query,
    setQuery: handleSetQuery,
    clear,
    results,
    hasResults: matchCount > 0 || query.trim().length === 0,
    isSearching,
    matchCount,
  }
}
