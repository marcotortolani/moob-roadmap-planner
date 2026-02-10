// src/hooks/use-bulk-selection.ts

'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Product } from '@/lib/types'

/**
 * Hook para gestionar selección múltiple de productos
 * Sprint 7.1: Bulk Operations
 *
 * @example
 * const {
 *   selectedIds,
 *   isSelected,
 *   toggleSelection,
 *   selectAll,
 *   clearSelection,
 *   selectedProducts
 * } = useBulkSelection(products)
 */
export function useBulkSelection(products: Product[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /**
   * Toggle selection de un producto individual
   */
  const toggleSelection = useCallback((productId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }, [])

  /**
   * Verificar si un producto está seleccionado
   */
  const isSelected = useCallback(
    (productId: string) => {
      return selectedIds.has(productId)
    },
    [selectedIds]
  )

  /**
   * Seleccionar todos los productos visibles
   */
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(products.map((p) => p.id)))
  }, [products])

  /**
   * Deseleccionar todos los productos
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  /**
   * Toggle entre seleccionar todo o nada
   */
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === products.length && products.length > 0) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [selectedIds.size, products.length, selectAll, clearSelection])

  /**
   * Obtener productos seleccionados
   */
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id))
  }, [products, selectedIds])

  /**
   * Verificar si todos están seleccionados
   */
  const allSelected = useMemo(() => {
    return products.length > 0 && selectedIds.size === products.length
  }, [products.length, selectedIds.size])

  /**
   * Verificar si algunos están seleccionados (para checkbox indeterminate)
   */
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < products.length
  }, [selectedIds.size, products.length])

  return {
    selectedIds,
    selectedProducts,
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    allSelected,
    someSelected,
  }
}
