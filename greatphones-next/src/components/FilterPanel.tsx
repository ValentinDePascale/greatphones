import { FilterConfig } from '@/hooks/useFilter'

export interface FilterOption {
  label: string
  value: string | number | boolean
}

export interface FilterField<T> {
  field: keyof T
  label: string
  type: 'select' | 'checkbox' | 'radio'
  options: FilterOption[]
}

export interface FilterPanelProps<T> {
  filters: FilterConfig<T>[]
  fields: FilterField<T>[]
  onFilterChange: (field: keyof T, value: any) => void
  onClearFilters: () => void
  hasFilters: boolean
}

export default function FilterPanel<T extends Record<string, any>>({
  filters,
  fields,
  onFilterChange,
  onClearFilters,
  hasFilters,
}: FilterPanelProps<T>) {
  const getFieldFilter = (field: keyof T) => {
    return filters.find(f => f.field === field)
  }

  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
          Filtros
        </h3>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'underline',
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {fields.map(field => {
          const currentFilter = getFieldFilter(field.field)

          if (field.type === 'select') {
            return (
              <div key={String(field.field)}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  {field.label}
                </label>
                <select
                  value={currentFilter?.value ?? ''}
                  onChange={e => onFilterChange(field.field, e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Todos</option>
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          }

          if (field.type === 'checkbox') {
            return (
              <div key={String(field.field)}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  {field.label}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {field.options.map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(currentFilter?.value)
                            ? currentFilter.value.includes(option.value)
                            : currentFilter?.value === option.value
                        }
                        onChange={e => {
                          if (Array.isArray(currentFilter?.value)) {
                            const updated = e.target.checked
                              ? [...currentFilter.value, option.value]
                              : currentFilter.value.filter(v => v !== option.value)
                            onFilterChange(field.field, updated.length > 0 ? updated : null)
                          } else {
                            onFilterChange(field.field, e.target.checked ? option.value : null)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          }

          if (field.type === 'radio') {
            return (
              <div key={String(field.field)}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  {field.label}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {field.options.map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      <input
                        type="radio"
                        checked={currentFilter?.value === option.value}
                        onChange={() => onFilterChange(field.field, option.value)}
                        style={{ cursor: 'pointer' }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
