import { Search, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import type { SortOption } from '@/hooks/use-product-filtering'
import { ENABLED_LANGUAGES } from '@/lib/languages'
import { COUNTRIES } from '@/lib/countries'

interface FiltersBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  yearFilter: number | 'all'
  onYearChange: (value: number | 'all') => void
  quarterFilter: number | 'all'
  onQuarterChange: (value: number | 'all') => void
  statusFilter: Status | 'all'
  onStatusChange: (value: Status | 'all') => void
  operatorFilter: string
  onOperatorChange: (value: string) => void
  countryFilter: string
  onCountryChange: (value: string) => void
  languageFilter: string
  onLanguageChange: (value: string) => void
  sortOption: SortOption
  onSortChange: (value: SortOption) => void
  uniqueYears: number[]
  uniqueOperators: string[]
  uniqueCountries: string[]
  activeFilterCount: number
  onClearFilters: () => void
}

export function FiltersBar({
  searchTerm,
  onSearchChange,
  yearFilter,
  onYearChange,
  quarterFilter,
  onQuarterChange,
  statusFilter,
  onStatusChange,
  operatorFilter,
  onOperatorChange,
  countryFilter,
  onCountryChange,
  languageFilter,
  onLanguageChange,
  sortOption,
  onSortChange,
  uniqueYears,
  uniqueOperators,
  uniqueCountries,
  activeFilterCount,
  onClearFilters,
}: FiltersBarProps) {
  // Helper function to get country name from code
  const getCountryName = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)
    return country ? country.name : code
  }
  return (
    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
      {/*  Search Bar */}
      <div className="relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar productos"
        />
      </div>

      {/* Desktop filters */}
      <div className="hidden lg:flex flex-row gap-2">
        <Select
          value={yearFilter.toString()}
          onValueChange={(value) =>
            onYearChange(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger className="w-28" aria-label="Filtrar por año">
            {yearFilter === 'all' ? 'Año' : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueYears.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={quarterFilter.toString()}
          onValueChange={(value) =>
            onQuarterChange(value === 'all' ? 'all' : Number(value))
          }
          disabled={yearFilter === 'all'}
        >
          <SelectTrigger className="w-24" aria-label="Filtrar por trimestre">
            {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value as Status | 'all')}
        >
          <SelectTrigger aria-label="Filtrar por estado">
            {statusFilter === 'all' ? 'Estado' : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operatorFilter} onValueChange={onOperatorChange}>
          <SelectTrigger aria-label="Filtrar por operador">
            {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueOperators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={onCountryChange}>
          <SelectTrigger aria-label="Filtrar por país">
            {countryFilter === 'all' ? (
              'País'
            ) : (
              <span>{getCountryName(countryFilter)}</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueCountries.map((c) => (
              <SelectItem key={c} value={c}>
                {getCountryName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={languageFilter} onValueChange={onLanguageChange}>
          <SelectTrigger aria-label="Filtrar por idioma">
            {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ENABLED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortOption}
          onValueChange={(value) => onSortChange(value as SortOption)}
        >
          <SelectTrigger
            className="hidden lg:flex min-w-[150px] lg:max-w-[200px]"
            aria-label="Ordenar productos"
          >
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc">Más antiguos</SelectItem>
            <SelectItem value="date-desc">Más nuevos</SelectItem>
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Clear filters button - shows when filters are active OR year is "all" (since default should be current year) */}
      {(activeFilterCount > 0 || yearFilter === 'all') && (
        <Button
          variant="default"
          size="sm"
          onClick={onClearFilters}
          className="ml-auto h-10  bg-red-100 text-red-700 border-2 border-black rounded-sm shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-destructive hover:text-white transition-all"
          aria-label="Borrar todos los filtros"
        >
          <X className="h-4 w-4 mr-1" />
          Borrar filtros
        </Button>
      )}
    </div>
  )
}
