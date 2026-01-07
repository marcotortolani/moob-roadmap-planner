// src/components/country-select.tsx

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { COUNTRIES } from "@/lib/countries"

export function CountrySelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedCountry = COUNTRIES.find(
    (country) => country.code === value
  )

  const filteredCountries = React.useMemo(() => {
    if (!searchValue) return COUNTRIES
    
    const search = searchValue.toLowerCase()
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search)
    )
  }, [searchValue])

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchValue("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Enfocar input al abrir
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSelect = (countryCode: string) => {
    onChange(countryCode)
    setSearchValue("")
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        {selectedCountry ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedCountry.flag}</span>
            <span>{selectedCountry.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Seleccionar país...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="flex items-center border-b px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar país..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="ml-2 hover:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontró el país.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    value === country.code && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// // src/components/country-select.tsx

// "use client"

// import * as React from "react"
// import { Check, ChevronsUpDown } from "lucide-react"

// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { COUNTRIES } from "@/lib/countries"

// export function CountrySelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
//   const [open, setOpen] = React.useState(false)
//   const [searchValue, setSearchValue] = React.useState("")
//   const inputRef = React.useRef<HTMLInputElement>(null)

//   const selectedCountry = COUNTRIES.find(
//     (country) => country.code === value
//   )

//   const filteredCountries = React.useMemo(() => {
//     if (!searchValue) return COUNTRIES
    
//     const search = searchValue.toLowerCase()
//     return COUNTRIES.filter((country) =>
//       country.name.toLowerCase().includes(search) ||
//       country.code.toLowerCase().includes(search)
//     )
//   }, [searchValue])

//   // Enfocar el input cuando se abre el popover
//   React.useEffect(() => {
//     if (open) {
//       setTimeout(() => {
//         inputRef.current?.focus()
//       }, 0)
//     }
//   }, [open])

//   return (
//     <Popover open={open} onOpenChange={setOpen} modal={true}>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           role="combobox"
//           aria-expanded={open}
//           className="w-full justify-between"
//         >
//           {selectedCountry ? (
//             <div className="flex items-center gap-2">
//               <span className="text-lg">{selectedCountry.flag}</span>
//               <span>{selectedCountry.name}</span>
//             </div>
//           ) : (
//             "Seleccionar país..."
//           )}
//           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent 
//         className="w-[--radix-popover-trigger-width] p-0" 
//         align="start"
//       >
//         <div className="flex flex-col z-50">
//           <div className=" p-2 border-b">
//             <Input
//               ref={inputRef}
//               placeholder="Buscar país..."
//               value={searchValue}
//               onChange={(e) => setSearchValue(e.target.value)}
//               className="h-9"
//             />
//           </div>
//           <ScrollArea className="h-[300px]" type="always">
//             <div className="p-1">
//               {filteredCountries.length === 0 ? (
//                 <div className="py-6 text-center text-sm text-muted-foreground">
//                   No se encontró el país.
//                 </div>
//               ) : (
//                 filteredCountries.map((country) => (
//                   <button
//                     key={country.code}
//                     type="button"
//                     onClick={(e) => {
//                       e.preventDefault()
//                       onChange(country.code)
//                       setSearchValue("")
//                       setOpen(false)
//                     }}
//                     className={cn(
//                       "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//                       value === country.code && "bg-accent"
//                     )}
//                   >
//                     <Check
//                       className={cn(
//                         "mr-2 h-4 w-4",
//                         value === country.code ? "opacity-100" : "opacity-0"
//                       )}
//                     />
//                     <div className="flex items-center gap-2">
//                       <span className="text-lg">{country.flag}</span>
//                       <span>{country.name}</span>
//                     </div>
//                   </button>
//                 ))
//               )}
//             </div>
//           </ScrollArea>
//         </div>
//       </PopoverContent>
//     </Popover>
//   )
// }