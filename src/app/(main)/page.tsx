// src/app/(main)/page.tsx

'use client'

// NOTE: 'export const dynamic' was removed from here because route segment
// configs are IGNORED in 'use client' files. It's now in layout.tsx (server component).

import { useState, useEffect, useCallback } from 'react'
import { ProductList } from '@/components/product-list'
import { ProductCalendar } from '@/components/product-calendar'
import { FloatingActionButton } from '@/components/floating-action-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductFiltering } from '@/hooks/use-product-filtering'
import { ErrorBoundary } from '@/components/error-boundary'
// import { DebugPanel } from '@/components/debug-panel'
import {
  FiltersBar,
  FiltersSheet,
  ActiveFiltersBadges,
  ViewTransitionWrapper,
} from './components'

function ProductsData({ view }: { view: string }) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

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

  if (loading) {
    return <ViewSkeleton />
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

            <div className="text-sm text-muted-foreground">
              Mostrando {filteredAndSortedProducts.length} de {products.length}{' '}
              productos.
            </div>
          </div>
        )}
      </ViewTransitionWrapper>

      {/* Contenedor con animación de slide */}
      <div className="relative flex-1 overflow-hidden">
        <ViewTransitionWrapper view={view}>
          {view === 'calendar' ? (
            <ProductCalendar products={filteredAndSortedProducts} />
          ) : (
            <ProductList
              products={filteredAndSortedProducts}
              yearFilter={yearFilter}
              quarterFilter={quarterFilter}
            />
          )}
        </ViewTransitionWrapper>
      </div>

      {/* Floating Action Button for creating new products */}
      <FloatingActionButton />
    </div>
  )
}

function ViewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-4 rounded-lg border p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
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

  // ✅ SECURITY: Wrap page in ErrorBoundary to catch React errors (Sprint 4.3)
  return (
    <ErrorBoundary>
      <ProductsData view={currentView} />
      {/* <DebugPanel /> */}
    </ErrorBoundary>
  )
}
