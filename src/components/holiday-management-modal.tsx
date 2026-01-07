'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from './date-picker';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Holiday,
  HolidayFormData,
  HolidaySchema,
} from '@/lib/types';
import {
  getHolidaysFromStorage,
  createOrUpdateHoliday,
  deleteHoliday,
} from '@/lib/actions';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function HolidayForm({
  holiday,
  onSave,
  onCancel,
}: {
  holiday?: Holiday | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<HolidayFormData>({
    resolver: zodResolver(HolidaySchema),
    defaultValues: {
      name: holiday?.name || '',
      date: holiday?.date ? new Date(holiday.date) : undefined,
    },
  });

  const onFormSubmit = async (data: HolidayFormData) => {
    const result = await createOrUpdateHoliday(data, holiday?.id);
    toast({
      title: result.success ? 'Éxito' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      onSave();
    }
  };

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
  );
}

export function HolidayManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchHolidays = () => {
    const storedHolidays = getHolidaysFromStorage();
    storedHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());
    setHolidays(storedHolidays);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHolidays();
    }
  }, [isOpen]);

  const handleAddNew = () => {
    setEditingHoliday(null);
    setIsFormOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setIsFormOpen(true);
  };

  const handleDelete = async (holidayId: string) => {
    const result = await deleteHoliday(holidayId);
    toast({
      title: result.success ? 'Éxito' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) {
      fetchHolidays();
    }
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingHoliday(null);
    fetchHolidays();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gestionar Feriados</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina los feriados del calendario.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isFormOpen ? (
            <HolidayForm
              holiday={editingHoliday}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
            />
          ) : (
            <>
              <div className="flex justify-end mb-4">
                 <Button size="sm" onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Feriado
                </Button>
              </div>
              <ScrollArea className="h-72">
                <div className="space-y-2 pr-6">
                  {holidays.map((holiday) => (
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(holiday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(holiday.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
         <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
