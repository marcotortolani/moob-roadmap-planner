// src/components/date-picker.tsx

'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { es } from 'date-fns/locale';
import { parse, format, isValid } from 'date-fns';
import { DayPickerSingleProps } from 'react-day-picker';

import { useControllableState } from '@/hooks/use-controllable-state';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const DATE_FORMAT = 'dd/MM/yyyy';

function formatDate(date: Date | undefined) {
  if (!date || !isValid(date)) {
    return '';
  }
  return format(date, DATE_FORMAT);
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime()) && isValid(date);
}

interface DatePickerProps extends Omit<DayPickerSingleProps, 'mode' | 'selected' | 'onSelect'> {
  value?: Date;
  onChange?: (date?: Date) => void;
}

export function DatePicker({
  value: valueProp,
  onChange,
  ...props
}: DatePickerProps) {
  const [value, setValue] = useControllableState<Date | undefined>({
    prop: valueProp,
    onChange,
  });
  
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [inputValue, setInputValue] = React.useState(formatDate(value));
  const [inputError, setInputError] = React.useState(false);

  // Sincronizar inputValue cuando cambia value desde fuera
  React.useEffect(() => {
    setInputValue(formatDate(value));
    if (value) {
      setMonth(value);
    }
    setInputError(false);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Limpiar caracteres no permitidos (solo números y /)
    newValue = newValue.replace(/[^\d/]/g, '');
    
    // Limitar longitud máxima
    if (newValue.length > 10) {
      return;
    }

    // Auto-agregar "/" en las posiciones correctas
    if (newValue.length === 2 && inputValue.length === 1) {
      newValue = newValue + '/';
    } else if (newValue.length === 5 && inputValue.length === 4) {
      newValue = newValue + '/';
    }

    setInputValue(newValue);
    setInputError(false);

    // Solo intentar parsear cuando el formato esté completo (10 caracteres: DD/MM/YYYY)
    if (newValue.length === 10) {
      const parsedDate = parse(newValue, DATE_FORMAT, new Date());
      
      if (isValidDate(parsedDate)) {
        setValue(parsedDate);
        setMonth(parsedDate);
        setInputError(false);
      } else {
        setInputError(true);
      }
    } else {
      // Si no está completo, limpiar el valor
      setValue(undefined);
    }
  };

  const handleInputBlur = () => {
    // Validar al perder el foco
    if (inputValue.length > 0 && inputValue.length < 10) {
      setInputError(true);
    } else if (inputValue.length === 10) {
      const parsedDate = parse(inputValue, DATE_FORMAT, new Date());
      
      if (!isValidDate(parsedDate)) {
        setInputError(true);
      } else {
        setInputError(false);
        // Reformatear para asegurar formato correcto
        setInputValue(formatDate(parsedDate));
      }
    } else if (inputValue.length === 0) {
      setInputError(false);
      setValue(undefined);
    }
  };

  const handleInputFocus = () => {
    setInputError(false);
  };

  const handleDaySelect = (date: Date | undefined) => {
    setValue(date);
    setInputValue(formatDate(date));
    setInputError(false);
    setOpen(false);
  };
  
  return (
    <div className="relative w-full">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={DATE_FORMAT.toUpperCase()}
        className={`pr-10 ${inputError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      {inputError && (
        <p className="text-xs text-destructive mt-1">
          Formato de fecha inválido. Use DD/MM/AAAA
        </p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">Seleccionar fecha</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            month={month}
            onMonthChange={setMonth}
            locale={es}
            {...props}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// // src/components/date-picker.tsx

// 'use client';

// import * as React from 'react';
// import { Calendar as CalendarIcon } from 'lucide-react';
// import { es } from 'date-fns/locale';
// import {
//   parse,
//   format,
//   isValid,
//   isSameDay,
// } from 'date-fns';
// import { DayPickerSingleProps } from 'react-day-picker';

// import { useControllableState } from '@/hooks/use-controllable-state';
// import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
// import { Input } from '@/components/ui/input';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from '@/components/ui/popover';

// const DATE_FORMAT = 'dd/MM/yyyy';

// interface DatePickerProps extends Omit<DayPickerSingleProps, 'mode' | 'selected' | 'onSelect'> {
//   value?: Date;
//   onChange?: (date?: Date) => void;
// }

// export function DatePicker({
//   value: valueProp,
//   onChange,
//   ...props
// }: DatePickerProps) {
//   const [value, setValue] = useControllableState<Date | undefined>({
//     prop: valueProp,
//     onChange,
//   });
//   const [inputValue, setInputValue] = React.useState<string>('');
//   const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

//   React.useEffect(() => {
//     if (value) {
//       setInputValue(format(value, DATE_FORMAT));
//     } else {
//       setInputValue('');
//     }
//   }, [value]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newInputValue = e.target.value;
//     setInputValue(newInputValue);

//     const parsedDate = parse(newInputValue, DATE_FORMAT, new Date());
//     if (isValid(parsedDate)) {
//       setValue(parsedDate);
//     } else {
//       setValue(undefined);
//     }
//   };

//   const handleDaySelect = (day: Date | undefined) => {
//     if (day) {
//       if (!value || !isSameDay(day, value)) {
//         setValue(day);
//       }
//       setInputValue(format(day, DATE_FORMAT));
//     } else {
//       setValue(undefined);
//       setInputValue('');
//     }
//     setIsPopoverOpen(false);
//   };
  
//   return (
//     <div className="relative w-full">
//       <Input
//         value={inputValue}
//         onChange={handleInputChange}
//         placeholder={DATE_FORMAT.toUpperCase()}
//         className="pr-10"
//       />
//       <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="ghost"
//             size="icon"
//             className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
//           >
//             <CalendarIcon className="h-4 w-4" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0" align="start">
//           <Calendar
//             mode="single"
//             selected={value}
//             onSelect={handleDaySelect}
//             initialFocus
//             locale={es}
//             {...props}
//           />
//         </PopoverContent>
//       </Popover>
//     </div>
//   );
// }
