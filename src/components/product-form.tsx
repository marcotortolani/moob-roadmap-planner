// src/components/product-form.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray } from 'react-hook-form'

import {
  ProductFormData,
  ProductSchema,
  Product,
  MilestoneStatus,
  Status,
} from '@/lib/types'
import { createOrUpdateProduct } from '@/lib/actions'
import { STATUS_OPTIONS, DEFAULT_COLORS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { useBusinessDaysCalculator } from '@/hooks/use-business-days-calculator'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ColorPicker } from './color-picker'
import {
  ProductBasicInfo,
  ProductDatesSection,
  ProductUrlsSection,
  ProductMilestonesSection,
} from './product-form/index'

export default function ProductForm({ product }: { product?: Product }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product?.name || '',
      operator: product?.operator || '',
      country: product?.country || '',
      language: product?.language || '',
      startDate: product?.startDate ? new Date(product.startDate) : undefined,
      endDate: product?.endDate ? new Date(product.endDate) : undefined,
      productiveUrl: product?.productiveUrl || '',
      vercelDemoUrl: product?.vercelDemoUrl || '',
      wpContentProdUrl: product?.wpContentProdUrl || '',
      wpContentTestUrl: product?.wpContentTestUrl || '',
      chatbotUrl: product?.chatbotUrl || '',
      comments: product?.comments || '',
      cardColor: product?.cardColor || DEFAULT_COLORS[0],
      status: (product?.status as Status) || Status.PLANNED,
      milestones:
        product?.milestones.map((m) => ({
          ...m,
          status: m.status || 'PENDING',
          startDate: new Date(m.startDate),
          endDate: new Date(m.endDate),
        })) || [],
      customUrls: product?.customUrls || [],
    },
  })

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control: form.control,
    name: 'milestones',
  })

  const {
    fields: customUrlFields,
    append: appendCustomUrl,
    remove: removeCustomUrl,
  } = useFieldArray({
    control: form.control,
    name: 'customUrls',
  })

  // Business days calculator hook
  const {
    dateInputMode,
    businessDaysCount,
    toggleDateInputMode,
    handleBusinessDaysChange,
    handleStartDateChange,
  } = useBusinessDaysCalculator(form, product)

  const onFormSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast({
        title: 'No autorizado',
        description: 'Debes iniciar sesión para realizar esta acción.',
        variant: 'destructive',
      })
      return
    }
    setIsPending(true)
    const result = await createOrUpdateProduct(data, user, product?.id)
    setIsPending(false)

    toast({
      title: result.success ? 'Éxito' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    })

    if (result.success) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    }
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6">
        <SheetTitle>
          {product ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </SheetTitle>
        <SheetDescription>
          {product
            ? 'Actualiza los detalles de tu producto.'
            : 'Completa el formulario para añadir un nuevo producto al roadmap.'}
        </SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFormSubmit)}
          className="space-y-8 px-6 pb-6"
        >
          <ProductBasicInfo control={form.control} />

          <ProductDatesSection
            control={form.control}
            watch={form.watch}
            dateInputMode={dateInputMode}
            businessDaysCount={businessDaysCount}
            onToggleDateInputMode={toggleDateInputMode}
            onBusinessDaysChange={handleBusinessDaysChange}
            onStartDateChange={handleStartDateChange}
          />

          <Separator />

          <ProductMilestonesSection
            control={form.control}
            milestoneFields={milestoneFields}
            onAppendMilestone={() =>
              appendMilestone({
                name: '',
                startDate: new Date(),
                endDate: new Date(),
                status: MilestoneStatus.PENDING,
              })
            }
            onRemoveMilestone={removeMilestone}
          />

          <Separator />

          <ProductUrlsSection
            control={form.control}
            customUrlFields={customUrlFields}
            onAppendCustomUrl={() => appendCustomUrl({ label: '', url: '' })}
            onRemoveCustomUrl={removeCustomUrl}
          />

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Estado y Apariencia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Estado del producto">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
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
              <FormField
                control={form.control}
                name="cardColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color de Tarjeta</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade comentarios o notas relevantes sobre el producto."
                      className="resize-none"
                      {...field}
                      aria-label="Comentarios sobre el producto"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </>
  )
}
