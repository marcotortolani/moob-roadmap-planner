'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronsUpDown, MessageSquare, CheckCircle, Circle, Clock } from 'lucide-react';
import { Product, MilestoneStatus } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getMilestoneStatusInfo = (status: MilestoneStatus) => {
    switch (status) {
        case 'COMPLETED':
            return { Icon: CheckCircle, color: 'text-green-500', label: 'Completado' };
        case 'IN_PROGRESS':
            return { Icon: Circle, color: 'text-blue-500', label: 'En progreso' };
        case 'PENDING':
        default:
            return { Icon: Clock, color: 'text-gray-500', label: 'Programado' };
    }
};


export function MilestoneList({ product }: { product: Product }) {
    if (!product.milestones || product.milestones.length === 0) {
        return null;
    }

  return (
    <div className="space-y-2 pt-2 mt-auto">
        <Collapsible>
        <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
                <span>Hitos Clave ({product.milestones.length})</span>
                <ChevronsUpDown className="h-4 w-4" />
            </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 px-4 pb-2">
            {product.milestones.map((milestone) => {
                 const statusInfo = getMilestoneStatusInfo(milestone.status);
                 return (
                    <div key={milestone.id} className="flex items-start gap-3">
                        <statusInfo.Icon className={`h-5 w-5 mt-0.5 ${statusInfo.color}`} />
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(milestone.startDate, 'MMM d', { locale: es })} - {format(milestone.endDate, 'MMM d', { locale: es })}
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{statusInfo.label}</Badge>
                    </div>
                )
            })}
        </CollapsibleContent>
        </Collapsible>
       {product.comments && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
            <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{product.comments}</p>
          </div>
        )}
    </div>
  );
}
