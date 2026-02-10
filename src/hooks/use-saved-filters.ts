// src/hooks/use-saved-filters.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Status } from '@/lib/types'

export interface FilterPreset {
  id: string
  name: string
  filters: {
    searchTerm?: string
    statusFilter?: Status | 'all'
    operatorFilter?: string
    countryFilter?: string
    languageFilter?: string
    yearFilter?: number | 'all'
    quarterFilter?: number | 'all'
    sortOption?: string
  }
  createdAt: string
}

const STORAGE_KEY = 'roadmap-filter-presets'

/**
 * Hook para gestionar presets de filtros guardados
 * Sprint 7.2: Saved Filters
 *
 * @example
 * const {
 *   presets,
 *   savePreset,
 *   loadPreset,
 *   deletePreset,
 *   renamePreset
 * } = useSavedFilters()
 */
export function useSavedFilters() {
  const [presets, setPresets] = useState<FilterPreset[]>([])

  /**
   * Cargar presets desde localStorage al montar
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPresets(parsed)
      }
    } catch (error) {
      console.error('[SavedFilters] Error loading presets:', error)
    }
  }, [])

  /**
   * Guardar preset actual
   */
  const savePreset = useCallback(
    (name: string, filters: FilterPreset['filters']): FilterPreset => {
      const newPreset: FilterPreset = {
        id: crypto.randomUUID(),
        name,
        filters,
        createdAt: new Date().toISOString(),
      }

      const updatedPresets = [...presets, newPreset]
      setPresets(updatedPresets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))

      return newPreset
    },
    [presets]
  )

  /**
   * Obtener preset por ID
   */
  const getPreset = useCallback(
    (presetId: string): FilterPreset | undefined => {
      return presets.find((p) => p.id === presetId)
    },
    [presets]
  )

  /**
   * Eliminar preset
   */
  const deletePreset = useCallback(
    (presetId: string) => {
      const updatedPresets = presets.filter((p) => p.id !== presetId)
      setPresets(updatedPresets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))
    },
    [presets]
  )

  /**
   * Renombrar preset
   */
  const renamePreset = useCallback(
    (presetId: string, newName: string) => {
      const updatedPresets = presets.map((p) =>
        p.id === presetId ? { ...p, name: newName } : p
      )
      setPresets(updatedPresets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))
    },
    [presets]
  )

  /**
   * Actualizar filters de un preset existente
   */
  const updatePreset = useCallback(
    (presetId: string, filters: FilterPreset['filters']) => {
      const updatedPresets = presets.map((p) =>
        p.id === presetId ? { ...p, filters } : p
      )
      setPresets(updatedPresets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))
    },
    [presets]
  )

  return {
    presets,
    savePreset,
    getPreset,
    deletePreset,
    renamePreset,
    updatePreset,
  }
}
