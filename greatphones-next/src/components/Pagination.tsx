export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  onItemsPerPageChange?: (items: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  maxVisiblePages?: number
  startIndex: number
  endIndex: number
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  maxVisiblePages = 5,
  startIndex,
  endIndex,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = []
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        borderRadius: '0 0 8px 8px',
      }}
    >
      {/* Info y select */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <span>
          Mostrando {startIndex}-{endIndex} de {totalItems}
        </span>

        {showItemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Items por página:</label>
            <select
              value={itemsPerPage}
              onChange={e => onItemsPerPageChange?.(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Botones de paginación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {/* Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: currentPage === 1 ? '#f3f4f6' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          ← Anterior
        </button>

        {/* Números de página */}
        {pageNumbers.map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            style={{
              padding: '6px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background:
                page === currentPage
                  ? '#667eea'
                  : page === '...'
                    ? 'transparent'
                    : 'white',
              color: page === currentPage ? 'white' : '#374151',
              cursor:
                page === '...' || page === currentPage ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: page === currentPage ? 600 : 500,
              border:
                page === currentPage
                  ? '1px solid #667eea'
                  : page === '...'
                    ? 'none'
                    : '1px solid #d1d5db',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (page !== '...' && page !== currentPage) {
                e.currentTarget.style.background = '#f3f4f6'
              }
            }}
            onMouseLeave={e => {
              if (page !== '...' && page !== currentPage) {
                e.currentTarget.style.background = 'white'
              }
            }}
          >
            {page}
          </button>
        ))}

        {/* Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: currentPage === totalPages ? '#f3f4f6' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
