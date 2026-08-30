'use client'

import { useAsync } from '@/hooks/useAsync'
import LoadingSpinner from './LoadingSpinner'
import SkeletonList from './SkeletonList'

export interface DataTableWithLoadingProps<T> {
  title: string
  fetchFn: () => Promise<T[]>
  renderRow: (item: T, index: number) => React.ReactNode
  columns: string[]
  emptyMessage?: string
}

export default function DataTableWithLoading<T>({
  title,
  fetchFn,
  renderRow,
  columns,
  emptyMessage = 'No hay datos disponibles',
}: DataTableWithLoadingProps<T>) {
  const { data, loading, error, retry } = useAsync(fetchFn)

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div
        style={{
          background: '#f9fafb',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
          {title}
        </h2>
        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              marginTop: '8px',
            }}
          >
            Error: {error.message}
            <button
              onClick={retry}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                color: '#991b1b',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '20px' }}>
          <SkeletonList count={5} variant="table" columns={columns.length} />
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
            No se pudieron cargar los datos. {emptyMessage}
          </p>
        </div>
      ) : !data || data.length === 0 ? (
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
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {columns.map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {renderRow(item, idx)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
