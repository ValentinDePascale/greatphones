import { useState, useMemo, useCallback } from 'react'

export interface UsePaginationOptions {
  initialPage?: number
  initialItemsPerPage?: number
  onPageChange?: (page: number) => void
}

export interface UsePaginationReturn<T> {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
  paginatedItems: T[]
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setItemsPerPage: (items: number) => void
  hasPrevPage: boolean
  hasNextPage: boolean
  startIndex: number
  endIndex: number
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
): UsePaginationReturn<T> {
  const { initialPage = 1, initialItemsPerPage = 10, onPageChange } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Validar página actual
  const validPage = Math.min(Math.max(currentPage, 1), totalPages || 1)

  const { paginatedItems, startIndex, endIndex } = useMemo(() => {
    const start = (validPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return {
      paginatedItems: items.slice(start, end),
      startIndex: totalItems === 0 ? 0 : start + 1,
      endIndex: Math.min(end, totalItems),
    }
  }, [validPage, itemsPerPage, items, totalItems])

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(page, 1), totalPages || 1)
      setCurrentPage(newPage)
      onPageChange?.(newPage)
    },
    [totalPages, onPageChange],
  )

  const nextPage = useCallback(() => {
    if (validPage < totalPages) {
      goToPage(validPage + 1)
    }
  }, [validPage, totalPages, goToPage])

  const prevPage = useCallback(() => {
    if (validPage > 1) {
      goToPage(validPage - 1)
    }
  }, [validPage, goToPage])

  const handleSetItemsPerPage = useCallback(
    (items: number) => {
      setItemsPerPage(items)
      goToPage(1) // Volver a página 1 cuando cambia items por página
    },
    [goToPage],
  )

  return {
    currentPage: validPage,
    itemsPerPage,
    totalItems,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage: handleSetItemsPerPage,
    hasPrevPage: validPage > 1,
    hasNextPage: validPage < totalPages,
    startIndex,
    endIndex,
  }
}
