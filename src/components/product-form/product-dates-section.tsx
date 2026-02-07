import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Control, UseFormWatch } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import type { ProductFormData } from '@/lib/types'

interface ProductDatesSectionProps {
  control: Control<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  dateInputMode: 'manual' | 'business-days'
  businessDaysCount: number
  onToggleDateInputMode: () => void
  onBusinessDaysChange: (count: number) => void
  onStartDateChange: (date: Date | undefined) => void
}

export function ProductDatesSection({
  control,
  watch,
  dateInputMode,
  businessDaysCount,
  onToggleDateInputMode,
  onBusinessDaysChange,
  onStartDateChange,
}: ProductDatesSectionProps) {
  return (
    <>
      {dateInputMode === 'manual' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Fecha de Inicio <span className="text-destructive">*</span>
                </FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  aria-required="true"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Fecha de Finalización{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  aria-required="true"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FormField
            control={control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Fecha de Inicio <span className="text-destructive">*</span>
                </FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={onStartDateChange}
                  aria-required="true"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <FormLabel>
              Días Laborables de Duración{' '}
              <span className="text-destructive">*</span>
            </FormLabel>
            <Input
              type="number"
              min="1"
              value={businessDaysCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 1
                onBusinessDaysChange(count)
              }}
              className="mt-2"
              aria-label="Días laborables de duración"
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Fecha fin calculada:{' '}
              {watch('endDate')
                ? format(watch('endDate'), 'PP', { locale: es })
                : '-'}
            </p>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleDateInputMode}
        className="w-full sm:w-auto"
      >
        {dateInputMode === 'manual'
          ? '📅 Usar días laborables'
          : '📝 Entrada manual de fechas'}
      </Button>
    </>
  )
}
