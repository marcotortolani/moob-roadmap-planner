'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from './date-picker'
import { ScrollArea } from './ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Holiday, HolidayFormData, HolidaySchema } from '@/lib/types'
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '@/hooks/queries'
import { Trash2, Edit, PlusCircle } from 'lucide-react'
import { format, getYear } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissionChecks } from '@/lib/rbac/hooks'

function HolidayForm({
  holiday,
  onSave,
  onCancel,
}: {
  holiday?: Holiday | null
  onSave: () => void
  onCancel: () => void
}) {
  const createHoliday = useCreateHoliday()
  const form = useForm<HolidayFormData>({
    resolver: zodResolver(HolidaySchema),
    defaultValues: {
      name: holiday?.name || '',
      date: holiday?.date ? new Date(holiday.date) : undefined,
    },
  })

  const onFormSubmit = (data: HolidayFormData) => {
    // Currently only supporting create (not update) since we don't have useUpdateHoliday
    createHoliday.mutate(data, {
      onSuccess: () => {
        onSave()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Feriado</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Form>
  )
}

export function HolidayManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())

  const { data: holidays = [] } = useHolidays()
  const deleteHoliday = useDeleteHoliday()
  const createHoliday = useCreateHoliday()
  const { canCreateHolidays, canEditHolidays, canDeleteHolidays } = usePermissionChecks()

  // Generate years range: 5 years before current year to 10 years after
  const currentYear = new Date().getFullYear()
  const availableYears = useMemo(() => {
    const years: number[] = []
    for (let year = currentYear - 5; year <= currentYear + 10; year++) {
      years.push(year)
    }
    return years
  }, [currentYear])

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => getYear(h.date) === yearFilter)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [holidays, yearFilter])

  // Fixed holidays that repeat every year
  const FIXED_HOLIDAYS = [
    { name: 'Año Nuevo', month: 0, day: 1 }, // January 1st
    { name: 'Fin de Año (no laborable/asueto habitual)', month: 11, day: 31 }, // December 31st
  ]

  // Generate fixed holidays for selected year if they don't exist
  const generateFixedHolidays = () => {
    const existingDates = new Set(
      holidays
        .filter((h) => getYear(h.date) === yearFilter)
        .map((h) => format(h.date, 'yyyy-MM-dd'))
    )

    FIXED_HOLIDAYS.forEach((fixedHoliday) => {
      const holidayDate = new Date(yearFilter, fixedHoliday.month, fixedHoliday.day)
      const dateStr = format(holidayDate, 'yyyy-MM-dd')

      // Only create if it doesn't already exist
      if (!existingDates.has(dateStr)) {
        createHoliday.mutate({
          name: fixedHoliday.name,
          date: holidayDate,
        })
      }
    })
  }

  const handleAddNew = () => {
    setEditingHoliday(null)
    setIsFormOpen(true)
  }

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setIsFormOpen(true)
  }

  const handleDelete = (holidayId: string) => {
    deleteHoliday.mutate(holidayId)
  }

  const handleSave = () => {
    setIsFormOpen(false)
    setEditingHoliday(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Feriados</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina los feriados del calendario.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
          {isFormOpen ? (
            <HolidayForm
              holiday={editingHoliday}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4 gap-2">
                <Select
                  value={yearFilter.toString()}
                  onValueChange={(value) => setYearFilter(Number(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canCreateHolidays && filteredHolidays.length < FIXED_HOLIDAYS.length && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateFixedHolidays}
                    disabled={createHoliday.isPending}
                  >
                    Generar Feriados Fijos
                  </Button>
                )}
                {canCreateHolidays && (
                  <Button size="sm" onClick={handleAddNew} className="ml-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Feriado
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-1 -mr-6">
                <div className="space-y-2 pr-6">
                  {filteredHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-semibold">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(holiday.date, 'PPP', { locale: es })}
                        </p>
                      </div>
                      {(canEditHolidays || canDeleteHolidays) && (
                        <div className="flex items-center gap-2">
                          {canEditHolidays && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(holiday)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteHolidays && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(holiday.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredHolidays.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      No hay feriados para el año seleccionado.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
