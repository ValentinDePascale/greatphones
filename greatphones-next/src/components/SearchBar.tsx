export interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  placeholder?: string
  onClear?: () => void
  matchCount?: number
  totalCount?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function SearchBar({
  query,
  onQueryChange,
  placeholder = 'Buscar...',
  onClear,
  matchCount,
  totalCount,
  disabled = false,
  size = 'md',
}: SearchBarProps) {
  const sizeMap = {
    sm: { padding: '6px 12px', fontSize: '12px', height: '32px' },
    md: { padding: '8px 14px', fontSize: '13px', height: '40px' },
    lg: { padding: '10px 16px', fontSize: '14px', height: '48px' },
  }

  const style = sizeMap[size]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 12px',
        background: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        transition: 'all 0.2s',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#667eea'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span style={{ color: '#9ca3af', fontSize: '18px' }}>🔍</span>

      <input
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: style.fontSize,
          padding: style.padding,
          height: style.height,
          color: '#1f2937',
          fontFamily: 'inherit',
        }}
      />

      {query && (
        <button
          onClick={() => {
            onQueryChange('')
            onClear?.()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          ✕
        </button>
      )}

      {matchCount !== undefined && totalCount !== undefined && query && (
        <span
          style={{
            fontSize: '11px',
            color: '#6b7280',
            whiteSpace: 'nowrap',
            paddingLeft: '8px',
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          {matchCount} de {totalCount}
        </span>
      )}
    </div>
  )
}
