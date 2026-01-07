// src/components/view-switcher.tsx

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { List, Calendar } from 'lucide-react';

import { cn } from '@/lib/utils';

export function ViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'list';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleToggle = () => {
    const newView = currentView === 'list' ? 'calendar' : 'list';
    localStorage.setItem('productView', newView);
    router.push(pathname + '?' + createQueryString('view', newView));
  };

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center gap-1 rounded-lg bg-gray-300 p-1 transition-colors hover:bg-gray-300/80"
      aria-label={`Cambiar a vista de ${currentView === 'list' ? 'calendario' : 'lista'}`}
    >
      {/* Indicador animado de fondo */}
      <div
        className={cn(
          'absolute inset-y-1 rounded-md bg-background shadow-sm transition-all duration-200 ease-in-out',
          currentView === 'list' 
            ? 'left-1 right-[calc(50%+2px)] sm:right-[calc(60%+2px)]' 
            : 'left-[calc(50%+2px)] sm:left-[calc(40%+2px)] right-1'
        )}
      />

      {/* Opción Lista */}
      <div
        className={cn(
          'relative z-10 flex items-center gap-2 px-3 py-1.5 transition-colors duration-200',
          currentView === 'list' 
            ? 'text-foreground' 
            : 'text-muted-foreground'
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden text-sm font-medium sm:inline">Lista</span>
      </div>

      {/* Opción Calendario */}
      <div
        className={cn(
          'relative z-10 flex items-center gap-2 px-3 py-1.5 transition-colors duration-200',
          currentView === 'calendar' 
            ? 'text-foreground' 
            : 'text-muted-foreground'
        )}
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden text-sm font-medium sm:inline">Calendario</span>
      </div>
    </button>
  );
}


// 'use client';

// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// import { useCallback } from 'react';
// import { List, Calendar } from 'lucide-react';

// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';

// export function ViewSwitcher() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const currentView = searchParams.get('view') || 'list';

//   const createQueryString = useCallback(
//     (name: string, value: string) => {
//       const params = new URLSearchParams(searchParams.toString());
//       params.set(name, value);
//       return params.toString();
//     },
//     [searchParams]
//   );

//   return (
//     <div className="flex items-center gap-1 rounded-lg bg-gray-300 p-1">
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => router.push(pathname + '?' + createQueryString('view', 'list'))}
//         className={cn(
//           'gap-2',
//           currentView === 'list' 
//             ? 'bg-background text-foreground shadow-sm' 
//             : 'text-muted-foreground'
//         )}
//       >
//         <List className="h-4 w-4" />
//         <span className="hidden sm:inline">Lista</span>
//       </Button>
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => router.push(pathname + '?' + createQueryString('view', 'calendar'))}
//         className={cn(
//           'gap-2',
//           currentView === 'calendar' 
//             ? 'bg-background text-foreground shadow-sm' 
//             : 'text-muted-foreground'
//         )}
//       >
//         <Calendar className="h-4 w-4" />
//         <span className="hidden sm:inline">Calendario</span>
//       </Button>
//     </div>
//   );
// }
