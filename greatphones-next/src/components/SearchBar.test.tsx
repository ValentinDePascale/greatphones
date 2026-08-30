import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from './SearchBar'

describe('SearchBar', () => {
  const mockOnQueryChange = vi.fn()
  const mockOnClear = vi.fn()

  const defaultProps = {
    query: '',
    onQueryChange: mockOnQueryChange,
    placeholder: 'Buscar...',
    onClear: mockOnClear,
  }

  it('debe renderizar input con placeholder', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Buscar...')
    expect(input).toBeInTheDocument()
  })

  it('debe mostrar valor actual de búsqueda', () => {
    render(<SearchBar {...defaultProps} query="test" />)

    const input = screen.getByDisplayValue('test')
    expect(input).toBeInTheDocument()
  })

  it('debe llamar onQueryChange cuando se tipea', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'nuevo' } })

    expect(mockOnQueryChange).toHaveBeenCalledWith('nuevo')
  })

  it('debe mostrar botón limpiar solo si hay query', () => {
    const { rerender } = render(<SearchBar {...defaultProps} query="" />)

    expect(screen.queryByText('✕')).not.toBeInTheDocument()

    rerender(<SearchBar {...defaultProps} query="test" />)

    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('debe limpiar búsqueda cuando se hace click en X', () => {
    render(<SearchBar {...defaultProps} query="test" />)

    const clearBtn = screen.getByText('✕')
    fireEvent.click(clearBtn)

    expect(mockOnQueryChange).toHaveBeenCalledWith('')
    expect(mockOnClear).toHaveBeenCalled()
  })

  it('debe mostrar información si hay matchCount y totalCount', () => {
    render(
      <SearchBar
        {...defaultProps}
        query="test"
        matchCount={10}
        totalCount={100}
      />
    )

    expect(screen.getByText('10 de 100')).toBeInTheDocument()
  })

  it('debe deshabilitar input si disabled es true', () => {
    render(<SearchBar {...defaultProps} disabled={true} />)

    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('debe renderizar con diferentes tamaños', () => {
    const { rerender } = render(<SearchBar {...defaultProps} size="sm" />)

    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()

    rerender(<SearchBar {...defaultProps} size="md" />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()

    rerender(<SearchBar {...defaultProps} size="lg" />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })
})
