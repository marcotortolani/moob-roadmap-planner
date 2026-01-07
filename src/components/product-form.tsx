// src/components/product-form.tsx

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import { PlusCircle, Trash2 } from 'lucide-react';

import { ProductFormData, ProductSchema, Product, MilestoneStatus, Status } from '@/lib/types';
import { createOrUpdateProduct } from '@/lib/actions';
import { STATUS_OPTIONS, DEFAULT_COLORS, MILESTONE_STATUS_OPTIONS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from './color-picker';
import { DatePicker } from './date-picker';
import { CountrySelect } from './country-select';

export default function ProductForm({ product }: { product?: Product }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

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
      milestones: product?.milestones.map(m => ({...m, status: m.status || 'PENDING', startDate: new Date(m.startDate), endDate: new Date(m.endDate)})) || [],
      customUrls: product?.customUrls || [],
    },
  });

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
    control: form.control,
    name: 'milestones',
  });
  
  const { fields: customUrlFields, append: appendCustomUrl, remove: removeCustomUrl } = useFieldArray({
    control: form.control,
    name: 'customUrls',
  });
  
  const onFormSubmit = async (data: ProductFormData) => {
    if (!user) {
        toast({ title: 'No autorizado', description: 'Debes iniciar sesión para realizar esta acción.', variant: 'destructive' });
        return;
    }
    setIsPending(true);
    const result = await createOrUpdateProduct(data, user, product?.id);
    setIsPending(false);

    toast({
        title: result.success ? 'Éxito' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
  };


  return (
    <>
      <SheetHeader className="px-6 pt-6">
        <SheetTitle>{product ? 'Editar Producto' : 'Crear Nuevo Producto'}</SheetTitle>
        <SheetDescription>
          {product
            ? 'Actualiza los detalles de tu producto.'
            : 'Completa el formulario para añadir un nuevo producto al roadmap.'}
        </SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8 px-6 pb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información General</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Total Fitness" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Movistar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <CountrySelect value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idioma</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Español" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Finalización</FormLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Separator />

          <div className="space-y-4">
             <h3 className="text-lg font-medium">Hitos del Proyecto</h3>
             {milestoneFields.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2 rounded-md border p-4 relative">
                     <div className="grid flex-1 gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                        <FormField
                        control={form.control}
                        name={`milestones.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2 md:col-span-1">
                            <FormLabel>Nombre del Hito</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inicio Hito</FormLabel>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`milestones.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fin Hito</FormLabel>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name={`milestones.${index}.status`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado Hito</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMilestone(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
             ))}
             <Button type="button" variant="outline" size="sm" onClick={() => appendMilestone({ name: '', startDate: new Date(), endDate: new Date(), status: MilestoneStatus.PENDING })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Hito
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">URLs y Configuración</h3>
             <FormField
                control={form.control}
                name="productiveUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Productiva</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vercelDemoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Demo Vercel</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="wpContentProdUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Content Prod (WordPress)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="wpContentTestUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Content Test (WordPress)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="chatbotUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Chatbot</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <Separator className="my-4"/>
                <h4 className="text-md font-medium">URLs Personalizadas</h4>
                {customUrlFields.map((item, index) => (
                    <div key={item.id} className="flex items-end gap-2 rounded-md border p-4 relative">
                        <div className="grid flex-1 gap-4 grid-cols-1 sm:grid-cols-2">
                             <FormField
                                control={form.control}
                                name={`customUrls.${index}.label`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Etiqueta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Diseño Figma" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name={`customUrls.${index}.url`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomUrl(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendCustomUrl({ label: '', url: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir URL Personalizada
                </Button>
          </div>

          <Separator />
          
          <div className="space-y-4">
             <h3 className="text-lg font-medium">Estado y Apariencia</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
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
                           <ColorPicker value={field.value} onChange={field.onChange} />
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
  );
}
