import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterPanel from './FilterPanel'

describe('FilterPanel', () => {
  const mockOnFilterChange = vi.fn()
  const mockOnClearFilters = vi.fn()

  const mockFields = [
    {
      field: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
      ],
    },
    {
      field: 'type',
      label: 'Tipo',
      type: 'checkbox' as const,
      options: [
        { label: 'Tipo A', value: 'a' },
        { label: 'Tipo B', value: 'b' },
      ],
    },
  ]

  const defaultProps = {
    filters: [],
    fields: mockFields,
    onFilterChange: mockOnFilterChange,
    onClearFilters: mockOnClearFilters,
    hasFilters: false,
  }

  it('debe renderizar título "Filtros"', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.getByText('Filtros')).toBeInTheDocument()
  })

  it('debe renderizar campos de filtro', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Tipo')).toBeInTheDocument()
  })

  it('debe renderizar select para campo select', () => {
    render(<FilterPanel {...defaultProps} />)

    const select = screen.getByDisplayValue('Todos')
    expect(select).toBeInTheDocument()
  })

  it('debe llamar onFilterChange cuando se cambia select', () => {
    render(<FilterPanel {...defaultProps} />)

    const selects = screen.getAllByDisplayValue('Todos')
    const selectElement = selects[0] as HTMLSelectElement
    fireEvent.change(selectElement, { target: { value: 'active' } })

    expect(mockOnFilterChange).toHaveBeenCalled()
  })

  it('debe renderizar checkboxes para campo checkbox', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.getByLabelText('Tipo A')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo B')).toBeInTheDocument()
  })

  it('debe llamar onFilterChange cuando se marca checkbox', () => {
    render(<FilterPanel {...defaultProps} />)

    const checkbox = screen.getByLabelText('Tipo A') as HTMLInputElement
    fireEvent.click(checkbox)

    expect(mockOnFilterChange).toHaveBeenCalled()
  })

  it('debe mostrar botón "Limpiar" si hasFilters es true', () => {
    render(<FilterPanel {...defaultProps} hasFilters={true} />)

    expect(screen.getByText('Limpiar')).toBeInTheDocument()
  })

  it('debe no mostrar botón "Limpiar" si hasFilters es false', () => {
    render(<FilterPanel {...defaultProps} hasFilters={false} />)

    expect(screen.queryByText('Limpiar')).not.toBeInTheDocument()
  })

  it('debe llamar onClearFilters cuando se hace click en Limpiar', () => {
    render(<FilterPanel {...defaultProps} hasFilters={true} />)

    const clearBtn = screen.getByText('Limpiar')
    fireEvent.click(clearBtn)

    expect(mockOnClearFilters).toHaveBeenCalled()
  })
})
