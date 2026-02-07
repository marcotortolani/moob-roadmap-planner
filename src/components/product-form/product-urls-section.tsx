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
import { Separator } from '@/components/ui/separator'
import type { ProductFormData } from '@/lib/types'

interface ProductUrlsSectionProps {
  control: Control<ProductFormData>
  customUrlFields: UseFieldArrayReturn<ProductFormData, 'customUrls'>['fields']
  onAppendCustomUrl: () => void
  onRemoveCustomUrl: (index: number) => void
}

export function ProductUrlsSection({
  control,
  customUrlFields,
  onAppendCustomUrl,
  onRemoveCustomUrl,
}: ProductUrlsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">URLs y Configuración</h3>
      <FormField
        control={control}
        name="productiveUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Productiva</FormLabel>
            <FormControl>
              <Input
                placeholder="https://..."
                {...field}
                type="url"
                aria-label="URL del sitio productivo"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="vercelDemoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Demo Vercel</FormLabel>
            <FormControl>
              <Input
                placeholder="https://..."
                {...field}
                type="url"
                aria-label="URL del demo en Vercel"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="wpContentProdUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Content Prod (WordPress)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://..."
                {...field}
                type="url"
                aria-label="URL del contenido WordPress productivo"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="wpContentTestUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Content Test (WordPress)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://..."
                {...field}
                type="url"
                aria-label="URL del contenido WordPress de pruebas"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="chatbotUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Chatbot</FormLabel>
            <FormControl>
              <Input
                placeholder="https://..."
                {...field}
                type="url"
                aria-label="URL del chatbot"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator className="bg-black my-4" style={{ height: '2px' }} />
      <h4 className="text-md font-medium">URLs Personalizadas</h4>
      {customUrlFields.map((item, index) => (
        <div
          key={item.id}
          className="flex items-end gap-2 rounded-md border p-4 relative"
        >
          <div className="grid flex-1 gap-4 grid-cols-1 sm:grid-cols-2">
            <FormField
              control={control}
              name={`customUrls.${index}.label`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Diseño Figma"
                      {...field}
                      aria-label={`Etiqueta de URL personalizada ${index + 1}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`customUrls.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      type="url"
                      aria-label={`URL personalizada ${index + 1}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveCustomUrl(index)}
            aria-label={`Eliminar URL personalizada ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAppendCustomUrl}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Añadir URL Personalizada
      </Button>
    </div>
  )
}
