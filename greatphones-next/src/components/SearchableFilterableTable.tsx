'use client'

import PaginatedTable, { PaginatedTableProps } from './PaginatedTable'
import SearchBar from './SearchBar'
import FilterPanel, { FilterField } from './FilterPanel'
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter'
import { usePagination } from '@/hooks/usePagination'

export interface SearchableFilterableTableProps<T extends Record<string, any>>
  extends Omit<PaginatedTableProps<T>, 'data'> {
  fullData: T[]
  searchFields?: (keyof T)[]
  filterFields?: FilterField<T>[]
  showSearch?: boolean
  showFilters?: boolean
  layoutType?: 'sidebar' | 'horizontal'
}

export default function SearchableFilterableTable<T extends Record<string, any>>({
  fullData,
  searchFields,
  filterFields = [],
  showSearch = true,
  showFilters = true,
  layoutType = 'horizontal',
  ...tableProps
}: SearchableFilterableTableProps<T>) {
  const search = useSearchAndFilter(fullData, {
    searchFields: searchFields as (keyof T)[],
  })

  const pagination = usePagination(search.results, {
    initialItemsPerPage: tableProps.initialItemsPerPage || 10,
  })

  const showFilterPanel = showFilters && filterFields.length > 0

  return (
    <div
      style={{
        display: layoutType === 'sidebar' ? 'grid' : 'flex',
        gridTemplateColumns: showFilterPanel ? '200px 1fr' : '1fr',
        gap: '20px',
        flexDirection: 'column',
      }}
    >
      {/* Filters Sidebar (if sidebar layout) */}
      {showFilterPanel && layoutType === 'sidebar' && (
        <FilterPanel
          filters={search.filters}
          fields={filterFields}
          onFilterChange={search.updateFilter}
          onClearFilters={search.clearFilters}
          hasFilters={search.hasFilters}
        />
      )}

      <div>
        {/* Search Bar */}
        {showSearch && (
          <div style={{ marginBottom: '16px' }}>
            <SearchBar
              query={search.query}
              onQueryChange={search.setQuery}
              matchCount={pagination.totalItems}
              totalCount={fullData.length}
              placeholder="Buscar..."
              size="md"
            />
          </div>
        )}

        {/* Filters Horizontal (if horizontal layout) */}
        {showFilterPanel && layoutType === 'horizontal' && (
          <div style={{ marginBottom: '16px' }}>
            <FilterPanel
              filters={search.filters}
              fields={filterFields}
              onFilterChange={search.updateFilter}
              onClearFilters={search.clearFilters}
              hasFilters={search.hasFilters}
            />
          </div>
        )}

        {/* Info */}
        {(search.isSearching || search.hasFilters) && (
          <div
            style={{
              marginBottom: '12px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            {search.isSearching && search.hasFilters
              ? `Mostrando ${pagination.totalItems} resultados con búsqueda y filtros`
              : search.isSearching
                ? `Mostrando ${pagination.totalItems} resultados para "${search.query}"`
                : `Mostrando ${pagination.totalItems} resultados con filtros aplicados`}
          </div>
        )}

        {/* Table */}
        <PaginatedTable
          {...tableProps}
          data={pagination.paginatedItems}
          loading={false}
          emptyMessage={
            search.isSearching || search.hasFilters
              ? 'No hay resultados que coincidan con tu búsqueda o filtros'
              : 'No hay datos disponibles'
          }
        />
      </div>
    </div>
  )
}
