// src/app/(main)/page.tsx

'use client'

// NOTE: 'export const dynamic' was removed from here because route segment
// configs are IGNORED in 'use client' files. It's now in layout.tsx (server component).

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ProductList } from '@/components/product-list'
import { ProductCalendar } from '@/components/product-calendar'
import { FloatingActionButton } from '@/components/floating-action-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductFiltering } from '@/hooks/use-product-filtering'
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
    uniqueLanguages,
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
          <div className="space-y-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
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
              uniqueLanguages={uniqueLanguages}
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
              uniqueLanguages={uniqueLanguages}
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

function HomePageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'list'

  useEffect(() => {
    const savedView = localStorage.getItem('productView')
    const currentViewInParams = searchParams.get('view')

    if (savedView && savedView !== currentViewInParams) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('view', savedView)
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [searchParams, router, pathname])

  return <ProductsData view={currentView} />
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<ViewSkeleton />}>
        <HomePageContent />
      </Suspense>
      {/* <DebugPanel /> */}
    </>
  )
}
