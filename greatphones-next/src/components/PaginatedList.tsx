'use client'

import { usePagination } from '@/hooks/usePagination'
import Pagination from './Pagination'
import SkeletonList from './SkeletonList'

export interface PaginatedListProps<T> {
  title?: string
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  loading?: boolean
  error?: Error | null
  emptyMessage?: string
  initialItemsPerPage?: number
  onPageChange?: (page: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

export default function PaginatedList<T>({
  title,
  data,
  renderItem,
  loading = false,
  error = null,
  emptyMessage = 'No hay elementos disponibles',
  initialItemsPerPage = 10,
  onPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
}: PaginatedListProps<T>) {
  const pagination = usePagination(data, {
    initialItemsPerPage,
    onPageChange,
  })

  return (
    <div
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        background: 'white',
      }}
    >
      {/* Header */}
      {title && (
        <div
          style={{
            background: '#f9fafb',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
            {title}
          </h2>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            fontSize: '12px',
            borderBottom: '1px solid #fecaca',
          }}
        >
          Error: {error.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ padding: '20px' }}>
          <SkeletonList count={pagination.itemsPerPage} variant="list" />
        </div>
      ) : error ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px' }}>
            No se pudieron cargar los datos.
          </p>
        </div>
      ) : pagination.totalItems === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px' }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* List */}
          <div style={{ padding: '16px' }}>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {pagination.paginatedItems.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f0f4ff'
                    e.currentTarget.style.borderColor = '#667eea'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f9fafb'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  {renderItem(item, idx)}
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              itemsPerPage={pagination.itemsPerPage}
              totalItems={pagination.totalItems}
              onItemsPerPageChange={pagination.setItemsPerPage}
              showItemsPerPage={showItemsPerPage}
              itemsPerPageOptions={itemsPerPageOptions}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          )}
        </>
      )}
    </div>
  )
}
