import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import type { SortOption } from '@/hooks/use-product-filtering'

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
  uniqueLanguages: string[]
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
  uniqueLanguages,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          className="neo-input pl-8 w-full"
          style={{ borderRadius: 0 }}
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
          <SelectTrigger className="neo-button w-28" style={{ borderRadius: 0 }} aria-label="Filtrar por año">
            {yearFilter === 'all' ? 'Año' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
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
          <SelectTrigger className="neo-button w-24" style={{ borderRadius: 0 }} aria-label="Filtrar por trimestre">
            {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
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
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }} aria-label="Filtrar por estado">
            {statusFilter === 'all' ? 'Estado' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operatorFilter} onValueChange={onOperatorChange}>
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }} aria-label="Filtrar por operador">
            {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueOperators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={onCountryChange}>
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }} aria-label="Filtrar por país">
            {countryFilter === 'all' ? 'País' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueCountries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={languageFilter} onValueChange={onLanguageChange}>
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }} aria-label="Filtrar por idioma">
            {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueLanguages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select
        value={sortOption}
        onValueChange={(value) => onSortChange(value as SortOption)}
      >
        <SelectTrigger
          className="neo-button hidden lg:flex lg:max-w-[200px]"
          style={{ borderRadius: 0 }}
          aria-label="Ordenar productos"
        >
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
          <SelectItem value="date-asc">Más antiguos</SelectItem>
          <SelectItem value="date-desc">Más nuevos</SelectItem>
          <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
