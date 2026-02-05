'use client';

import { cn } from '@/lib/utils';
import { DEFAULT_COLORS } from '@/lib/constants';
import { Check, Palette } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DEFAULT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
          style={{ backgroundColor: color, borderColor: value.toLowerCase() === color.toLowerCase() ? 'hsl(var(--primary))' : 'transparent' }}
          onClick={() => onChange(color)}
          aria-label={`Select color ${color}`}
        >
          {value.toLowerCase() === color.toLowerCase() && (
            <Check className="h-full w-full p-1.5 text-primary-foreground" />
          )}
        </button>
      ))}
      <div
        className="relative h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:scale-110 transition-all"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full cursor-pointer appearance-none rounded-full border-none bg-transparent p-0 opacity-0"
          aria-label="Personalizar color"
        />
        <div className="pointer-events-none absolute inset-0 rounded-full flex items-center justify-center">
          <Palette className="h-4 w-4" style={{ color: '#FFFFFF' }} />
        </div>
      </div>
    </div>
  );
}
