import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CountrySelect } from '@/components/country-select'
import { LanguageSelect } from '@/components/language-select'
import { OperatorCombobox } from '@/components/operator-combobox'
import { ProductNameCombobox } from '@/components/product-name-combobox'
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
            <ProductNameCombobox
              value={field.value}
              onChange={field.onChange}
            />
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
              <OperatorCombobox
                value={field.value}
                onChange={field.onChange}
              />
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
            <LanguageSelect value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
