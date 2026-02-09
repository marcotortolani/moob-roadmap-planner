import { Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import type { SortOption } from '@/hooks/use-product-filtering'
import { ENABLED_LANGUAGES } from '@/lib/languages'
import { COUNTRIES } from '@/lib/countries'

interface FiltersSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeFilterCount: number
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
}

export function FiltersSheet({
  isOpen,
  onOpenChange,
  activeFilterCount,
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
}: FiltersSheetProps) {
  // Helper function to get country name from code
  const getCountryName = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)
    return country ? country.name : code
  }
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0 bg-destructive"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l-3 border-black pl-3 pr-4">
        <SheetHeader>
          <SheetTitle>Filtros y Ordenamiento</SheetTitle>
          <SheetDescription>
            Filtra y ordena los productos del roadmap
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="grid grid-cols-1 gap-4">
            <h4 className="text-lg font-semibold">Filtros</h4>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={yearFilter.toString()}
                onValueChange={(value) =>
                  onYearChange(value === 'all' ? 'all' : Number(value))
                }
              >
                <SelectTrigger aria-label="Filtrar por año">
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
                <SelectTrigger aria-label="Filtrar por trimestre">
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
            </div>
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
            <Separator />
            <h4 className="text-lg font-semibold">Ordenar</h4>
            <Select
              value={sortOption}
              onValueChange={(value) => onSortChange(value as SortOption)}
            >
              <SelectTrigger aria-label="Ordenar productos">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
