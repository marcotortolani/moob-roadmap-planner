import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import type { FilterType } from '@/hooks/use-product-filtering'

interface ActiveFiltersBadgesProps {
  searchTerm: string
  yearFilter: number | 'all'
  quarterFilter: number | 'all'
  statusFilter: Status | 'all'
  operatorFilter: string
  countryFilter: string
  languageFilter: string
  activeFilterCount: number
  onRemoveFilter: (filter: FilterType) => void
  onClearAll: () => void
}

export function ActiveFiltersBadges({
  searchTerm,
  yearFilter,
  quarterFilter,
  statusFilter,
  operatorFilter,
  countryFilter,
  languageFilter,
  activeFilterCount,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBadgesProps) {
  if (activeFilterCount === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Filtros activos:</span>
      {searchTerm && (
        <Badge variant="secondary">
          Búsqueda: {searchTerm}
          <button
            onClick={() => onRemoveFilter('search')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de búsqueda"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {yearFilter !== 'all' && (
        <Badge variant="secondary">
          Año: {yearFilter}
          <button
            onClick={() => onRemoveFilter('year')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de año"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {quarterFilter !== 'all' && yearFilter !== 'all' && (
        <Badge variant="secondary">
          Quarter: Q{quarterFilter}
          <button
            onClick={() => onRemoveFilter('quarter')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de trimestre"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {statusFilter !== 'all' && (
        <Badge variant="secondary">
          Estado: {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
          <button
            onClick={() => onRemoveFilter('status')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de estado"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {operatorFilter !== 'all' && (
        <Badge variant="secondary">
          Operador: {operatorFilter}
          <button
            onClick={() => onRemoveFilter('operator')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de operador"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {countryFilter !== 'all' && (
        <Badge variant="secondary">
          País: {countryFilter}
          <button
            onClick={() => onRemoveFilter('country')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de país"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {languageFilter !== 'all' && (
        <Badge variant="secondary">
          Idioma: {languageFilter}
          <button
            onClick={() => onRemoveFilter('language')}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Quitar filtro de idioma"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-sm text-destructive hover:text-destructive"
      >
        Limpiar todo
      </Button>
    </div>
  )
}
