'use client'

import { ENABLED_LANGUAGES } from '@/lib/languages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
        <SelectValue placeholder="Seleccionar idioma..." />
      </SelectTrigger>
      <SelectContent className="border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
        {ENABLED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
