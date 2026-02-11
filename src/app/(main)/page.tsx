// src/app/(main)/page.tsx

'use client'

// NOTE: 'export const dynamic' was removed from here because route segment
// configs are IGNORED in 'use client' files. It's now in layout.tsx (server component).

import { useState, useEffect, useCallback } from 'react'
import { ProductList } from '@/components/product-list'
import { ProductCalendar } from '@/components/product-calendar'
import { FloatingActionButton } from '@/components/floating-action-button'
import { useProductFiltering } from '@/hooks/use-product-filtering'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { useDeleteProduct, useUpdateProduct } from '@/hooks/queries'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { SavedFiltersMenu } from '@/components/saved-filters-menu'
import { ExportMenu } from '@/components/export-menu'
import { ToolsSheet } from '@/components/tools-sheet'
import { FilterPreset, useSavedFilters } from '@/hooks/use-saved-filters'
import { exportToExcel, exportToCSV } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { CheckSquare, X } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'
import { Status } from '@/lib/types'
import {
  ProductListSkeleton,
  ProductCalendarSkeleton,
} from '@/components/skeletons'
import { toast } from 'sonner'
// import { DebugPanel } from '@/components/debug-panel'
import {
  FiltersBar,
  FiltersSheet,
  ActiveFiltersBadges,
  ViewTransitionWrapper,
} from './components'

function ProductsData({ view }: { view: string }) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)

  const {
    products,
    filteredAndSortedProducts,
    loading,
    searchTerm,
    statusFilter,
    operatorFilter,
    countryFilter,
    languageFilter,
    yearFilter,
    quarterFilter,
    sortOption,
    uniqueOperators,
    uniqueCountries,
    uniqueYears,
    activeFilterCount,
    setSearchTerm,
    setStatusFilter,
    setOperatorFilter,
    setCountryFilter,
    setLanguageFilter,
    setYearFilter,
    setQuarterFilter,
    setSortOption,
    clearFilters,
    removeFilter,
  } = useProductFiltering()

  // Sprint 7.1: Bulk Operations
  const deleteProductMutation = useDeleteProduct()
  const updateProductMutation = useUpdateProduct()

  const {
    selectedIds,
    selectedProducts,
    selectedCount,
    isSelected,
    toggleSelection,
    clearSelection,
  } = useBulkSelection(filteredAndSortedProducts)

  // Handlers for bulk actions
  const handleDeleteSelected = useCallback(async () => {
    const productIds = Array.from(selectedIds)

    for (const id of productIds) {
      await deleteProductMutation.mutateAsync(id)
    }

    toast.success(`${productIds.length} productos eliminados`)
    clearSelection()
    setSelectionMode(false)
  }, [selectedIds, deleteProductMutation, clearSelection])

  const handleChangeStatus = useCallback(
    async (status: Status) => {
      for (const product of selectedProducts) {
        await updateProductMutation.mutateAsync({
          ...product,
          status,
        })
      }

      toast.success(
        `${selectedProducts.length} productos actualizados a "${status}"`
      )
      clearSelection()
      setSelectionMode(false)
    },
    [selectedProducts, updateProductMutation, clearSelection]
  )

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev)
    if (selectionMode) {
      clearSelection()
    }
  }, [selectionMode, clearSelection])

  // Get saved filters for ToolsSheet (must be before callbacks that use it)
  const { presets, deletePreset } = useSavedFilters()

  // Sprint 7.2: Load filters from preset
  const handleLoadFilters = useCallback(
    (filters: FilterPreset['filters']) => {
      if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm)
      if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter)
      if (filters.operatorFilter !== undefined) setOperatorFilter(filters.operatorFilter)
      if (filters.countryFilter !== undefined) setCountryFilter(filters.countryFilter)
      if (filters.languageFilter !== undefined) setLanguageFilter(filters.languageFilter)
      if (filters.yearFilter !== undefined) setYearFilter(filters.yearFilter)
      if (filters.quarterFilter !== undefined) setQuarterFilter(filters.quarterFilter)
      if (filters.sortOption !== undefined) setSortOption(filters.sortOption)
    },
    [
      setSearchTerm,
      setStatusFilter,
      setOperatorFilter,
      setCountryFilter,
      setLanguageFilter,
      setYearFilter,
      setQuarterFilter,
      setSortOption,
    ]
  )

  // Load filter from preset (for ToolsSheet)
  const handleLoadFilterPreset = useCallback(
    (preset: FilterPreset) => {
      handleLoadFilters(preset.filters)
    },
    [handleLoadFilters]
  )

  // Delete filter preset (for ToolsSheet)
  const handleDeleteFilterPreset = useCallback(
    (presetId: string) => {
      deletePreset(presetId)
      toast.success('Filtro eliminado')
    },
    [deletePreset]
  )

  // Sprint 7.2: Current filters for saving
  const currentFilters: FilterPreset['filters'] = {
    searchTerm,
    statusFilter,
    operatorFilter,
    countryFilter,
    languageFilter,
    yearFilter,
    quarterFilter,
    sortOption,
  }

  // Sprint 7 Responsive: Quick export handlers for ToolsSheet
  const handleQuickExportExcel = useCallback(async () => {
    const result = await exportToExcel(filteredAndSortedProducts, {
      filename: 'roadmap-export',
      includeComments: true,
      includeUrls: true,
    })

    if (result.success) {
      toast.success(`${result.count} productos exportados a Excel`)
    } else {
      toast.error(`Error al exportar: ${result.error}`)
    }
  }, [filteredAndSortedProducts])

  const handleQuickExportCSV = useCallback(async () => {
    const result = await exportToCSV(filteredAndSortedProducts, {
      filename: 'roadmap-export',
      includeComments: true,
      includeUrls: true,
    })

    if (result.success) {
      toast.success(`${result.count} productos exportados a CSV`)
    } else {
      toast.error(`Error al exportar: ${result.error}`)
    }
  }, [filteredAndSortedProducts])

  if (loading) {
    return <ViewSkeleton view={view} />
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-screen">
      <ViewTransitionWrapper view={view}>
        {view === 'list' && (
          <div className="space-y-2 border-3 border-black shadow-neo-md bg-white p-4">
            <FiltersBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              yearFilter={yearFilter}
              onYearChange={setYearFilter}
              quarterFilter={quarterFilter}
              onQuarterChange={setQuarterFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              operatorFilter={operatorFilter}
              onOperatorChange={setOperatorFilter}
              countryFilter={countryFilter}
              onCountryChange={setCountryFilter}
              languageFilter={languageFilter}
              onLanguageChange={setLanguageFilter}
              sortOption={sortOption}
              onSortChange={setSortOption}
              uniqueYears={uniqueYears}
              uniqueOperators={uniqueOperators}
              uniqueCountries={uniqueCountries}
              activeFilterCount={activeFilterCount}
              onClearFilters={clearFilters}
            />

            {/* Mobile filter trigger */}
            <FiltersSheet
              isOpen={isFilterSheetOpen}
              onOpenChange={setIsFilterSheetOpen}
              activeFilterCount={activeFilterCount}
              yearFilter={yearFilter}
              onYearChange={setYearFilter}
              quarterFilter={quarterFilter}
              onQuarterChange={setQuarterFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              operatorFilter={operatorFilter}
              onOperatorChange={setOperatorFilter}
              countryFilter={countryFilter}
              onCountryChange={setCountryFilter}
              languageFilter={languageFilter}
              onLanguageChange={setLanguageFilter}
              sortOption={sortOption}
              onSortChange={setSortOption}
              uniqueYears={uniqueYears}
              uniqueOperators={uniqueOperators}
              uniqueCountries={uniqueCountries}
            />

            <ActiveFiltersBadges
              searchTerm={searchTerm}
              yearFilter={yearFilter}
              quarterFilter={quarterFilter}
              statusFilter={statusFilter}
              operatorFilter={operatorFilter}
              countryFilter={countryFilter}
              languageFilter={languageFilter}
              activeFilterCount={activeFilterCount}
              onRemoveFilter={removeFilter}
              onClearAll={clearFilters}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredAndSortedProducts.length} de {products.length}{' '}
                productos.
              </div>

              <div className="flex items-center gap-2">
                {/* Sprint 7 Responsive: Mobile - ToolsSheet */}
                <div className="md:hidden">
                  <ToolsSheet
                    products={filteredAndSortedProducts}
                    onExportExcel={handleQuickExportExcel}
                    onExportCSV={handleQuickExportCSV}
                    savedFiltersCount={presets.length}
                    savedFilters={presets}
                    onLoadFilter={handleLoadFilterPreset}
                    onDeleteFilter={handleDeleteFilterPreset}
                    selectionMode={selectionMode}
                    onToggleSelectionMode={toggleSelectionMode}
                  />
                </div>

                {/* Sprint 7: Desktop - Individual buttons */}
                <div className="hidden md:flex md:items-center md:gap-2">
                  {/* Sprint 7.3: Export to Excel/CSV */}
                  <ExportMenu products={filteredAndSortedProducts} />

                  {/* Sprint 7.2: Saved Filters */}
                  <SavedFiltersMenu
                    currentFilters={currentFilters}
                    onLoadFilters={handleLoadFilters}
                  />

                  {/* Sprint 7.1: Toggle selection mode */}
                  <Button
                    variant={selectionMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="gap-2"
                  >
                    {selectionMode ? (
                      <>
                        <X className="h-4 w-4" />
                        Cancelar selección
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Seleccionar múltiples
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ViewTransitionWrapper>

      {/* Contenedor con animación de slide */}
      <div className="relative flex-1 overflow-hidden">
        <ViewTransitionWrapper view={view}>
          {view === 'calendar' ? (
            <ProductCalendar products={products} />
          ) : (
            <ProductList
              products={filteredAndSortedProducts}
              yearFilter={yearFilter}
              quarterFilter={quarterFilter}
              selectionMode={selectionMode}
              isSelected={isSelected}
              onToggleSelection={toggleSelection}
            />
          )}
        </ViewTransitionWrapper>
      </div>

      {/* Sprint 7.1: Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
        onChangeStatus={handleChangeStatus}
        isVisible={selectionMode && selectedCount > 0}
      />

      {/* Floating Action Button for creating new products */}
      <FloatingActionButton />
    </div>
  )
}

/**
 * Smart Skeleton Screen (Sprint 5.2)
 * Shows different skeleton based on current view
 */
function ViewSkeleton({ view }: { view: string }) {
  if (view === 'calendar') {
    return <ProductCalendarSkeleton />
  }

  return <ProductListSkeleton />
}

/**
 * Read the current view from URL search params or localStorage.
 * Uses native browser APIs instead of useSearchParams() to avoid
 * requiring a Suspense boundary. Cached RSC payloads with an unresolved
 * Suspense fallback would prevent child components from ever mounting,
 * causing the "infinite skeleton" bug.
 */
function useViewParam(): string {
  const [view, setView] = useState<string>('list')

  const syncView = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const urlView = params.get('view')
    const savedView = localStorage.getItem('productView')

    // URL param takes precedence, then localStorage, then default 'list'
    const resolvedView = urlView || savedView || 'list'

    // Sync URL if it doesn't have the view param
    if (!urlView && savedView) {
      const newParams = new URLSearchParams(window.location.search)
      newParams.set('view', savedView)
      window.history.replaceState(null, '', `?${newParams.toString()}`)
    }

    setView(resolvedView)
  }, [])

  useEffect(() => {
    syncView()

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', syncView)

    // Listen for custom viewchange events from ViewSwitcher
    const handleViewChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail) setView(detail)
    }
    window.addEventListener('viewchange', handleViewChange)

    return () => {
      window.removeEventListener('popstate', syncView)
      window.removeEventListener('viewchange', handleViewChange)
    }
  }, [syncView])

  return view
}

export default function HomePage() {
  const currentView = useViewParam()

  // ✅ QUICK WIN 2: Enable keyboard shortcuts (Cmd+K, Cmd+N)
  useKeyboardShortcuts()

  // ✅ SECURITY: Wrap page in ErrorBoundary to catch React errors (Sprint 4.3)
  return (
    <ErrorBoundary>
      <ProductsData view={currentView} />
      {/* <DebugPanel /> */}
    </ErrorBoundary>
  )
}
