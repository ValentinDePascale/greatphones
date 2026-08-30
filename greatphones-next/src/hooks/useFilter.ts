import { useState, useMemo, useCallback } from 'react'

export type FilterValue = string | number | boolean | string[] | null
export type FilterOperator = 'equals' | 'includes' | 'startsWith' | 'greaterThan' | 'lessThan'

export interface FilterConfig<T> {
  field: keyof T
  value: FilterValue
  operator?: FilterOperator
}

export interface UseFilterOptions<T> {
  onFiltersChange?: (filters: FilterConfig<T>[]) => void
}

export interface UseFilterReturn<T> {
  filters: FilterConfig<T>[]
  addFilter: (filter: FilterConfig<T>) => void
  removeFilter: (field: keyof T) => void
  updateFilter: (field: keyof T, value: FilterValue) => void
  clearFilters: () => void
  results: T[]
  hasFilters: boolean
  matchCount: number
}

export function useFilter<T extends Record<string, any>>(
  items: T[],
  options: UseFilterOptions<T> = {},
): UseFilterReturn<T> {
  const { onFiltersChange } = options
  const [filters, setFilters] = useState<FilterConfig<T>[]>([])

  const results = useMemo(() => {
    if (filters.length === 0) return items

    return items.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field]
        const operator = filter.operator ?? 'equals'

        switch (operator) {
          case 'equals':
            if (Array.isArray(filter.value)) {
              return filter.value.includes(value)
            }
            return value === filter.value

          case 'includes':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase())

          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase())

          case 'greaterThan':
            return Number(value) > Number(filter.value)

          case 'lessThan':
            return Number(value) < Number(filter.value)

          default:
            return true
        }
      })
    })
  }, [filters, items])

  const addFilter = useCallback(
    (filter: FilterConfig<T>) => {
      setFilters(prev => {
        const newFilters = prev.filter(f => f.field !== filter.field)
        newFilters.push(filter)
        onFiltersChange?.(newFilters)
        return newFilters
      })
    },
    [onFiltersChange],
  )

  const removeFilter = useCallback(
    (field: keyof T) => {
      setFilters(prev => {
        const newFilters = prev.filter(f => f.field !== field)
        onFiltersChange?.(newFilters)
        return newFilters
      })
    },
    [onFiltersChange],
  )

  const updateFilter = useCallback(
    (field: keyof T, value: FilterValue) => {
      addFilter({ field, value })
    },
    [addFilter],
  )

  const clearFilters = useCallback(() => {
    setFilters([])
    onFiltersChange?.([])
  }, [onFiltersChange])

  return {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    results,
    hasFilters: filters.length > 0,
    matchCount: results.length,
  }
}
