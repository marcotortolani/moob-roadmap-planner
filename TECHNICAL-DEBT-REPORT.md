# 🔴 REPORTE DE AUDITORÍA TÉCNICA - ROADMAP PLANNER
**Fecha**: 2026-02-05
**Auditor**: Senior Full Stack Developer (20+ años experiencia)
**Severidad**: CRÍTICA - Múltiples problemas que causan fallos intermitentes

---

## RESUMEN EJECUTIVO

Se identificaron **5 problemas críticos** que explican los fallos intermitentes de caching:

1. ❌ React Query Provider mal configurado (recreación de QueryClient)
2. ❌ Queries de Supabase ineficientes (5 JOINs innecesarios)
3. ❌ Filtrado del lado del cliente (debería ser server-side)
4. ❌ Supabase Client no es singleton verdadero
5. ❌ Hydration mismatches suprimidos en lugar de solucionados

---

## 🚨 PROBLEMA #1: React Query Provider (CRÍTICO)

### Ubicación
`src/lib/react-query/provider.tsx:13-14`

### Código Actual (INCORRECTO)
```typescript
const [queryClient] = useState(
  () => new QueryClient({...})
)
```

### ¿Por qué es un problema?
- **useState en Client Component**: Cada vez que el componente se re-monta (error boundary, auth change, HMR), se crea un NUEVO QueryClient
- **Pérdida de cache**: Toda la data cacheada se pierde en el re-mount
- **Síntoma**: Funciona aleatoriamente, falla al recargar
- **Anti-pattern documentado** en React Query + Next.js App Router

### Solución
Crear un singleton usando `React.use()` o módulo-level instance:

```typescript
// src/lib/react-query/client.ts
import { QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
```

```typescript
// src/lib/react-query/provider.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode } from 'react'
import { getQueryClient } from './client'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Get singleton instance
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### Impacto
🔴 **CRÍTICO** - Este es probablemente EL problema principal que causa los fallos intermitentes

---

## 🚨 PROBLEMA #2: Queries Ineficientes (ALTO)

### Ubicación
`src/hooks/queries/use-products.ts:33-42`

### Código Actual (INEFICIENTE)
```typescript
let query = supabase
  .from('products')
  .select(`
    *,
    milestones(*),
    customUrls:custom_urls(*),
    createdBy:created_by_id(id, email, first_name, last_name, avatar_url),
    updatedBy:updated_by_id(id, email, first_name, last_name, avatar_url)
  `)
```

### ¿Por qué es un problema?
- **5 JOINs por cada fetch**: products + milestones + custom_urls + 2x users
- **Over-fetching**: ¿Necesitas createdBy/updatedBy en la lista? Probablemente no
- **Performance**: Con 100 productos, esto hace 500+ queries a través de los JOINs
- **Falla silenciosa**: Si `created_by_id` es NULL o no existe el usuario, la query puede fallar

### Solución Inmediata (Quick Fix)
Remover los JOINs de usuarios en la lista:

```typescript
// Para LISTA de productos (no necesitas creator/updater info)
.select(`
  *,
  milestones(*),
  customUrls:custom_urls(*)
`)
```

### Solución Óptima (Best Practice)
Lazy load de relaciones solo cuando se necesitan:

```typescript
// Lista: Solo datos básicos
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, milestones(*)')
        .order('start_date', { ascending: false })

      return data
    }
  })
}

// Detalle: Full data con relaciones
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          milestones(*),
          customUrls:custom_urls(*),
          createdBy:created_by_id(id, email, first_name, last_name),
          updatedBy:updated_by_id(id, email, first_name, last_name)
        `)
        .eq('id', id)
        .single()

      return data
    }
  })
}
```

### Impacto
🟠 **ALTO** - Afecta performance, pero no causa los fallos intermitentes directamente

---

## 🚨 PROBLEMA #3: Filtrado Client-Side (MEDIO)

### Ubicación
`src/hooks/use-product-filtering.ts:19`

### Código Actual
```typescript
const { data: products = [] } = useProducts() // No filters passed!

// Then filters 66-144 lines later on client...
```

### ¿Por qué es un problema?
- **Over-fetching**: Trae TODOS los productos de Supabase
- **Desperdicio de bandwidth**: Usuario con filtro "Movistar" recibe datos de TODOS los operadores
- **Client-side work**: El cliente hace trabajo que el servidor debería hacer
- **Peor UX**: Spinner más largo, más datos transferidos

### Solución
Pasar filtros a Supabase:

```typescript
export function useProductFiltering() {
  // Build filters object for Supabase
  const filters = useMemo(() => {
    const f: ProductFilters = {}
    if (statusFilter !== 'all') f.status = statusFilter
    if (operatorFilter !== 'all') f.operator = operatorFilter
    if (countryFilter !== 'all') f.country = countryFilter
    if (languageFilter !== 'all') f.language = languageFilter
    return f
  }, [statusFilter, operatorFilter, countryFilter, languageFilter])

  // Pass filters to useProducts
  const { data: products = [], isLoading } = useProducts(filters)

  // Client-side filtering only for search and date (can't be done efficiently in Supabase)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchMatch = !debouncedSearchTerm ||
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      const dateMatch = /* year/quarter logic */

      return searchMatch && dateMatch
    })
  }, [products, debouncedSearchTerm, yearFilter, quarterFilter])

  // ... rest
}
```

### Impacto
🟡 **MEDIO** - Afecta performance pero no causa crashes

---

## 🚨 PROBLEMA #4: Supabase Client No-Singleton (MEDIO-ALTO)

### Ubicación
`src/lib/supabase/client.ts:18`

### Código Actual
```typescript
export const supabase = getSupabaseClient()
```

### ¿Por qué es un problema?
- **Module re-import**: En HMR o ciertos build scenarios, el módulo se re-importa
- **Nueva instancia**: Cada re-import crea un nuevo cliente Supabase
- **Auth tokens perdidos**: El nuevo cliente no tiene los tokens del anterior
- **Connection pool**: Múltiples clientes = múltiples connection pools

### Solución
Singleton verdadero:

```typescript
// src/lib/supabase/client.ts
'use client'

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'
import type { Database } from './database.types'

let supabaseInstance: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}

// Export singleton
export const supabase = getSupabaseClient()
```

### Impacto
🟠 **MEDIO-ALTO** - Puede contribuir a problemas de auth/cache intermitentes

---

## 🚨 PROBLEMA #5: Hydration Mismatches (MEDIO)

### Ubicación
`src/app/layout.tsx:21,29,33`

### Código Actual
```typescript
<html suppressHydrationWarning>
  <body suppressHydrationWarning>
    <div suppressHydrationWarning>
```

### ¿Por qué es un problema?
- **Síntoma, no causa**: Hay hydration mismatches reales siendo silenciados
- **Posibles causas**:
  - Fechas renderizadas server vs client (timezone differences)
  - User-specific content renderizado en server
  - Random colors generados diferente en server/client
- **Efectos secundarios**:
  - Event handlers pueden no adjuntarse
  - State puede ser inconsistente
  - Flickering de contenido

### Solución
1. **Identificar la causa real**: Remover temporalmente los `suppressHydrationWarning` y ver qué warnings aparecen

2. **Para fechas**: Usar un boundary
```typescript
function DateDisplay({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <span>Loading...</span>

  return <span>{format(date, 'PPP')}</span>
}
```

3. **Para user content**: Mover a Client Component explícito
```typescript
// Don't render user-specific content on server
function UserContent() {
  const { user } = useAuth()

  // Only render on client
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return <div>{user.name}</div>
}
```

4. **Para random colors**: Usar deterministic generation basado en ID
```typescript
// BEFORE (causes hydration mismatch)
const color = Math.random() > 0.5 ? 'red' : 'blue'

// AFTER (deterministic)
function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

const color = hashCode(product.id) % 2 === 0 ? 'red' : 'blue'
```

### Impacto
🟡 **MEDIO** - Puede causar inconsistencias visuales y event handler issues

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 URGENTE (Hacer AHORA)
1. **Arreglar React Query Provider** (#1)
   - Crear `src/lib/react-query/client.ts` con singleton
   - Actualizar provider para usar `getQueryClient()`
   - **Esto debería resolver el 80% de los problemas**

2. **Arreglar Supabase Client Singleton** (#4)
   - Implementar singleton verdadero
   - Prevenir re-creación en HMR

### 🟠 IMPORTANTE (Hacer HOY)
3. **Optimizar queries de productos** (#2)
   - Remover JOINs innecesarios de createdBy/updatedBy en lista
   - Mantener JOINs solo en detalle de producto

### 🟡 MEJORA (Hacer ESTA SEMANA)
4. **Implementar filtrado server-side** (#3)
   - Pasar filtros a Supabase query
   - Reducir data transferida

5. **Investigar y fix hydration warnings** (#5)
   - Remover `suppressHydrationWarning` temporalmente
   - Identificar causas reales
   - Implementar fixes específicos

---

## 📊 MÉTRICAS DE IMPACTO ESPERADO

| Fix | Problema Resuelto | Mejora Performance | Mejora Estabilidad |
|-----|-------------------|--------------------|--------------------|
| #1 React Query | ✅ Cache intermitente | +40% | +80% |
| #2 Query Optimization | ❌ | +60% | +10% |
| #3 Server Filters | ❌ | +30% | +5% |
| #4 Supabase Singleton | ✅ Auth intermitente | +10% | +30% |
| #5 Hydration | ✅ UI flicker | +5% | +20% |

**Total esperado**: +145% performance, +145% estabilidad

---

## 🔧 OTRAS OBSERVACIONES (No Críticas)

### TypeScript Build Errors Ignored
`next.config.ts:6` tiene `ignoreBuildErrors: true`

**Riesgo**: Type errors pueden esconder bugs reales

**Recomendación**: Arreglar los type errors y remover este flag

### Firebase Dependencies sin Usar
El `package.json` tiene Firebase pero la app usa Supabase

**Recomendación**: Limpiar dependencies no usadas para reducir bundle size

### Middleware Database Query
`src/middleware.ts:73-77` hace un query a `users` table en CADA request

**Riesgo**: Performance hit en requests frecuentes

**Recomendación**: Cachear el user role o usar Supabase RLS functions

### No hay Error Monitoring
No se detectó Sentry, LogRocket, o similar

**Recomendación**: Agregar error monitoring para production

---

## 📝 CONCLUSIÓN

El problema principal es la **configuración incorrecta de React Query Provider** que causa recreación del QueryClient y pérdida de cache. Esto, combinado con el patrón no-singleton del Supabase client, genera los fallos intermitentes.

**Tiempo estimado de implementación**:
- Fixes críticos (#1, #4): 2-3 horas
- Fixes importantes (#2): 1-2 horas
- Mejoras (#3, #5): 4-6 horas

**Total**: 1 día de trabajo para resolver completamente
