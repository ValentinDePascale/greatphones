import { useSearch, UseSearchOptions, UseSearchReturn } from './useSearch'
import { useFilter, FilterConfig, UseFilterOptions, UseFilterReturn } from './useFilter'
import { useMemo } from 'react'

export interface UseSearchAndFilterOptions<T> extends UseSearchOptions<T>, UseFilterOptions<T> {}

export interface UseSearchAndFilterReturn<T>
  extends UseSearchReturn<T>,
    UseFilterReturn<T> {
  allResults: T[]
}

export function useSearchAndFilter<T extends Record<string, any>>(
  items: T[],
  options: UseSearchAndFilterOptions<T> = {},
): UseSearchAndFilterReturn<T> {
  // Primero filtrar
  const filter = useFilter(items, options)

  // Luego buscar sobre los resultados filtrados
  const search = useSearch(filter.results, options)

  // Resultados finales
  const allResults = useMemo(() => search.results, [search.results])

  return {
    // Search properties
    query: search.query,
    setQuery: search.setQuery,
    clear: search.clear,
    isSearching: search.isSearching,

    // Filter properties
    filters: filter.filters,
    addFilter: filter.addFilter,
    removeFilter: filter.removeFilter,
    updateFilter: filter.updateFilter,
    clearFilters: filter.clearFilters,
    hasFilters: filter.hasFilters,

    // Combined results
    results: allResults,
    hasResults: allResults.length > 0 || (search.query.length === 0 && filter.filters.length === 0),
    matchCount: allResults.length,
    allResults,
  }
}
