import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CountrySelect } from '@/components/country-select'
import type { ProductFormData } from '@/lib/types'

interface ProductBasicInfoProps {
  control: Control<ProductFormData>
}

export function ProductBasicInfo({ control }: ProductBasicInfoProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Información General</h3>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nombre de producto <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                className="neo-input"
                style={{ borderRadius: 0 }}
                placeholder="Ej: Total Fitness"
                {...field}
                aria-required="true"
                aria-invalid={!!field.value && field.value.length === 0}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="operator"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Operador <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  className="neo-input"
                  style={{ borderRadius: 0 }}
                  placeholder="Ej: Movistar"
                  {...field}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                País <span className="text-destructive">*</span>
              </FormLabel>
              <CountrySelect
                value={field.value}
                onChange={field.onChange}
                aria-required="true"
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Idioma <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                className="neo-input"
                style={{ borderRadius: 0 }}
                placeholder="Ej: Español"
                {...field}
                aria-required="true"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
