'use client'

import { usePagination } from '@/hooks/usePagination'
import Pagination from './Pagination'
import SkeletonList from './SkeletonList'

export interface PaginatedTableProps<T> {
  title?: string
  data: T[]
  columns: { key: string; label: string; width?: string }[]
  renderCell?: (value: any, column: string, item: T) => React.ReactNode
  loading?: boolean
  error?: Error | null
  emptyMessage?: string
  initialItemsPerPage?: number
  onPageChange?: (page: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

export default function PaginatedTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  renderCell,
  loading = false,
  error = null,
  emptyMessage = 'No hay datos disponibles',
  initialItemsPerPage = 10,
  onPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
}: PaginatedTableProps<T>) {
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
          <SkeletonList
            count={pagination.itemsPerPage}
            variant="table"
            columns={columns.length}
          />
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
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151',
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '12px 16px',
                          color: '#374151',
                        }}
                      >
                        {renderCell
                          ? renderCell(item[col.key], col.key, item)
                          : String(item[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
