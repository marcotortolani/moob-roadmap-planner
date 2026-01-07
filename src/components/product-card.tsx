
'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Globe,
  MoreVertical,
  Trash2,
  Edit,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { Product, Status } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/constants';
import { COUNTRIES } from '@/lib/countries';
import { useAuth } from '@/context/auth-context';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import ProductForm from './product-form';
import { deleteProduct } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ProductDetailModal } from './product-detail-modal';
import { cn } from '@/lib/utils';


function InfoLine({
  icon: Icon,
  text,
  flag
}: {
  icon: React.ElementType;
  text: string | null | undefined;
  flag?: string | null;
}) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {flag ? <span className="text-lg">{flag}</span> : <Icon className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );
}

const getStatusBadgeClass = (status: Status) => {
    switch (status) {
        case 'IN_PROGRESS':
            return 'bg-red-500/20 text-red-700 border-red-500/30';
        case 'DEMO_OK':
            return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
        case 'LIVE':
            return 'bg-green-500/20 text-green-700 border-green-500/30';
        case 'PLANNED':
        default:
            return ''; // default outline variant
    }
}


export function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const status = STATUS_OPTIONS.find((s) => s.value === product.status);
  const country = COUNTRIES.find((c) => c.code === product.country);

  const handleDelete = async () => {
    const result = await deleteProduct(product.id);
     toast({
        title: result.success ? 'Éxito' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
  };

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col"
        style={{ borderLeft: `12px solid ${product.cardColor}` }}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div className="flex-1" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
                <CardTitle className="font-headline text-xl">{product.name}</CardTitle>
                <CardDescription>
                {format(product.startDate, 'd MMM', { locale: es })} -{' '}
                {format(product.endDate, 'd MMM, yyyy', { locale: es })}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
            {status && <Badge variant="outline" className={cn(getStatusBadgeClass(product.status))}>{status.label}</Badge>}
            {user && (
                <Sheet>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <SheetTrigger asChild>
                        <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        </SheetTrigger>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                            >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto y todos sus datos asociados.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Eliminar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                        <ProductForm product={product} />
                    </SheetContent>
                </Sheet>
            )}
            </div>
        </CardHeader>
        <CardContent className="grid gap-4 flex-1 pt-2" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <InfoLine icon={MapPin} text={product.operator} />
            <InfoLine icon={MapPin} text={country?.name} flag={country?.flag} />
            <InfoLine icon={Globe} text={product.language} />
            </div>

            {product.comments && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md mt-auto">
                <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{product.comments}</p>
              </div>
            )}

        </CardContent>
      </Card>
      {isModalOpen && (
        <ProductDetailModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
