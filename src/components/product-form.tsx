// src/components/product-form.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

import {
  ProductFormData,
  ProductSchema,
  Product,
  MilestoneStatus,
  Status,
} from '@/lib/types'
import { STATUS_OPTIONS, DEFAULT_COLORS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { useBusinessDaysCalculator } from '@/hooks/use-business-days-calculator'
import { useCreateProduct, useUpdateProduct } from '@/hooks/queries'

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
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const isPending = product
    ? updateProduct.isPending
    : createProduct.isPending

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

  const onFormSubmit = (data: ProductFormData) => {
    if (!user) {
      toast({
        title: 'No autorizado',
        description: 'Debes iniciar sesión para realizar esta acción.',
        variant: 'destructive',
      })
      return
    }

    const productData = {
      ...data,
      createdById: user.id,
      updatedById: user.id,
    }

    if (product) {
      // Update existing product
      updateProduct.mutate(
        {
          id: product.id,
          ...productData,
        },
        {
          onSuccess: () => {
            // Wait a bit to show the toast before closing
            setTimeout(() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
            }, 500)
          },
          onError: () => {
            // Don't close on error so user can fix issues
          },
        }
      )
    } else {
      // Create new product - productData is already validated by Zod schema
      createProduct.mutate(productData, {
        onSuccess: () => {
          // Wait a bit to show the toast before closing
          setTimeout(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
          }, 500)
        },
        onError: () => {
          // Don't close on error so user can fix issues
        },
      })
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

          <Separator className="bg-black" style={{ height: '2px' }} />

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

          <Separator className="bg-black" style={{ height: '2px' }} />

          <ProductUrlsSection
            control={form.control}
            customUrlFields={customUrlFields}
            onAppendCustomUrl={() => appendCustomUrl({ label: '', url: '' })}
            onRemoveCustomUrl={removeCustomUrl}
          />

          <Separator className="bg-black" style={{ height: '2px' }} />

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
            <Button type="submit" disabled={isPending} className="min-w-[160px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {product ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                product ? 'Actualizar Producto' : 'Crear Producto'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </>
  )
}
