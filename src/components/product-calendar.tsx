
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  isWithinInterval,
  getDay,
  startOfWeek,
  addDays,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Product, Milestone, Holiday } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProductDetailModal } from './product-detail-modal';
import { getHolidaysFromStorage, saveHolidaysToStorage } from '@/lib/actions';
import { INITIAL_HOLIDAYS } from '@/lib/holidays';
import { HolidayManagementModal } from './holiday-management-modal';

const parseHolidayDate = (dateString: string): Date => {
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset);
}


export function ProductCalendar({ products }: { products: Product[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  useEffect(() => {
    const fetchHolidays = () => {
      let storedHolidays = getHolidaysFromStorage();
      if (storedHolidays.length === 0) {
        // When initializing from JSON, parse dates correctly
        storedHolidays = INITIAL_HOLIDAYS.map(h => ({...h, date: parseHolidayDate(h.date), id: crypto.randomUUID()}));
        saveHolidaysToStorage(storedHolidays);
      }
      setHolidays(storedHolidays);
    };

    fetchHolidays();
    window.addEventListener('storage', fetchHolidays);
    return () => window.removeEventListener('storage', fetchHolidays);
  }, []);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);
  
  const weekDays = useMemo(() => {
      const firstDayOfWeek = startOfWeek(new Date(), { locale: es, weekStartsOn: 1 });
      return Array.from({ length: 5 }).map((_, i) =>
        format(addDays(firstDayOfWeek, i), 'eeee', { locale: es })
      );
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach(h => {
        // Ensure date is valid before formatting
        if (h.date && !isNaN(h.date.getTime())) {
          map.set(format(h.date, 'yyyy-MM-dd'), h);
        }
    });
    return map;
  }, [holidays]);

  const getProductsForDay = (day: Date): Product[] => {
    return products.filter(p => isWithinInterval(day, { start: p.startDate, end: p.endDate }));
  }
  
  const getMilestoneForDay = (day: Date, productId: string): Milestone | undefined => {
     const product = products.find(p => p.id === productId);
     return product?.milestones.find(m => isSameDay(m.startDate, day));
  }
  
  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight font-headline">
            No tienes productos
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea un producto para verlo en el calendario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-2 sm:p-4 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-headline text-lg sm:text-xl font-semibold capitalize text-center w-40">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday} className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm">Hoy</Button>
             <Button variant="outline" size="sm" onClick={() => setIsHolidayModalOpen(true)}>
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Gestionar Feriados</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 flex-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-medium text-muted-foreground text-xs sm:text-sm capitalize pb-2 border-b">
              {day}
            </div>
          ))}

          {daysInMonth.map((day) => {
            const dayOfWeek = getDay(day);
            if (dayOfWeek === 0 || dayOfWeek === 6) { 
                return null;
            }

            const holiday = holidayMap.get(format(day, 'yyyy-MM-dd'));
            const productEvents = !holiday ? getProductsForDay(day) : [];
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  'relative min-h-[100px] sm:min-h-[120px] p-1.5 border-b border-r flex flex-col',
                  isToday(day) && 'border-2 border-destructive',
                  !isSameMonth(day, currentMonth) && 'bg-muted/30 text-muted-foreground',
                  holiday && 'bg-neutral-300 text-black'
                )}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'text-xs h-6 w-6 flex items-center justify-center rounded-full',
                    isToday(day) && 'bg-primary font-bold text-primary-foreground',
                    !isSameMonth(day, currentMonth) && 'text-muted-foreground/60'
                  )}
                >
                  {format(day, 'd')}
                </time>
                <div className="mt-1 flex-1 overflow-y-auto space-y-1">
                 {productEvents.map(productEvent => {
                    const milestoneEvent = getMilestoneForDay(day, productEvent.id);
                    return (
                        <Tooltip key={productEvent.id}>
                        <TooltipTrigger asChild>
                            <div
                            className="group relative w-full rounded-sm px-1.5 py-1 text-xs text-white truncate cursor-pointer transition-all duration-200 hover:opacity-80"
                            style={{ backgroundColor: productEvent.cardColor }}
                            onClick={() => setSelectedProduct(productEvent)}
                            >
                              <ExternalLink className="absolute top-1 right-1 h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="font-bold group-hover:text-neutral-800">{productEvent.name}</p>
                            <p className="opacity-80 group-hover:text-neutral-800">{productEvent.operator} / {productEvent.country}</p>
                            {milestoneEvent && <p className="font-semibold italic pt-1 group-hover:text-neutral-800">{milestoneEvent.name}</p>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold">{productEvent.name}</p>
                            <p className="text-sm text-muted-foreground">{productEvent.operator} / {productEvent.country}</p>
                            {milestoneEvent && <p className="text-sm text-blue-400 pt-1">Hito: {milestoneEvent.name}</p>}
                        </TooltipContent>
                        </Tooltip>
                    )
                 })}
                   {holiday && (
                      <div className="text-center text-xs p-2">
                        {holiday.name}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedProduct && (
        <ProductDetailModal 
            product={selectedProduct} 
            isOpen={!!selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
        />
      )}
       <HolidayManagementModal
            isOpen={isHolidayModalOpen}
            onClose={() => setIsHolidayModalOpen(false)}
        />
    </TooltipProvider>
  );
}
