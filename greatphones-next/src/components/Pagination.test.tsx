import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from './Pagination'

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()
  const mockOnItemsPerPageChange = vi.fn()

  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: mockOnPageChange,
    itemsPerPage: 10,
    totalItems: 100,
    onItemsPerPageChange: mockOnItemsPerPageChange,
    startIndex: 1,
    endIndex: 10,
  }

  it('debe renderizar información de paginación', () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByText('Mostrando 1-10 de 100')).toBeInTheDocument()
  })

  it('debe renderizar botones de navegación', () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByText('← Anterior')).toBeInTheDocument()
    expect(screen.getByText('Siguiente →')).toBeInTheDocument()
  })

  it('debe desabilitar botón Anterior en página 1', () => {
    render(<Pagination {...defaultProps} currentPage={1} />)

    const anteriorBtn = screen.getByText('← Anterior')
    expect(anteriorBtn).toBeDisabled()
  })

  it('debe desabilitar botón Siguiente en última página', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />)

    const siguienteBtn = screen.getByText('Siguiente →')
    expect(siguienteBtn).toBeDisabled()
  })

  it('debe renderizar números de página', () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('debe llamar onPageChange cuando se hace click en un número', () => {
    render(<Pagination {...defaultProps} />)

    const page2 = screen.getByText('2')
    fireEvent.click(page2)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('debe renderizar selector de items por página', () => {
    render(<Pagination {...defaultProps} showItemsPerPage={true} />)

    const select = screen.getByDisplayValue('10')
    expect(select).toBeInTheDocument()
  })

  it('debe llamar onItemsPerPageChange cuando se cambia selector', () => {
    render(<Pagination {...defaultProps} showItemsPerPage={true} />)

    const select = screen.getByDisplayValue('10') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '25' } })

    expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(25)
  })

  it('debe no renderizar selector si showItemsPerPage es false', () => {
    render(<Pagination {...defaultProps} showItemsPerPage={false} />)

    expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument()
  })
})
