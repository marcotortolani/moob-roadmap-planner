import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarHeaderProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onManageHolidays: () => void
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onManageHolidays,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2
          className="font-headline text-lg sm:text-xl font-semibold capitalize text-center w-40"
          aria-live="polite"
        >
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onToday}
          className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
        >
          Hoy
        </Button>
        <Button variant="outline" size="sm" onClick={onManageHolidays}>
          <CalendarDays className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Gestionar Feriados</span>
        </Button>
      </div>
    </div>
  )
}
