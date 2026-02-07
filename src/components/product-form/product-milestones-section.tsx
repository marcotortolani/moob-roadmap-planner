import { PlusCircle, Trash2 } from 'lucide-react'
import type { Control, UseFieldArrayReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { MILESTONE_STATUS_OPTIONS } from '@/lib/constants'
import type { ProductFormData } from '@/lib/types'

interface ProductMilestonesSectionProps {
  control: Control<ProductFormData>
  milestoneFields: UseFieldArrayReturn<ProductFormData, 'milestones'>['fields']
  onAppendMilestone: () => void
  onRemoveMilestone: (index: number) => void
}

export function ProductMilestonesSection({
  control,
  milestoneFields,
  onAppendMilestone,
  onRemoveMilestone,
}: ProductMilestonesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Hitos del Proyecto</h3>
      {milestoneFields.map((item, index) => (
        <div
          key={item.id}
          className="flex items-end gap-2 rounded-md border p-4 relative"
        >
          <div className="grid flex-1 gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <FormField
              control={control}
              name={`milestones.${index}.name`}
              render={({ field }) => (
                <FormItem className="sm:col-span-2 md:col-span-1">
                  <FormLabel>Nombre del Hito</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-label={`Nombre del hito ${index + 1}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`milestones.${index}.startDate`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inicio Hito</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    aria-label={`Fecha de inicio del hito ${index + 1}`}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`milestones.${index}.endDate`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin Hito</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    aria-label={`Fecha de fin del hito ${index + 1}`}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`milestones.${index}.status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Hito</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-label={`Estado del hito ${index + 1}`}>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MILESTONE_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveMilestone(index)}
            aria-label={`Eliminar hito ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAppendMilestone}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Añadir Hito
      </Button>
    </div>
  )
}
