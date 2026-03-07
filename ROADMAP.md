# Roadmap — Roadmap Planner App

Documento vivo de planificación. Se actualiza junto con `CHANGELOG.md` en cada release.
Última revisión: 2026-03-07 · Versión actual: v0.7.0

---

## Crítico — Hacer ya

### DB-01 · Ejecutar índices de performance en Supabase

- **Archivo:** `sql/schema/create-performance-indexes.sql`
- **Impacto:** -70% tiempo de query (estimado 700ms → ~200ms)
- **Acción:** Ejecutar en Supabase SQL Editor y verificar con `SELECT * FROM pg_indexes WHERE schemaname = 'public'`

### DB-02 · Ejecutar fix de seguridad en Supabase

- **Archivo:** `sql/fixes/fix-security-issues.sql`
- **Impacto:** Resuelve 28 warnings de performance + 2 advisories de seguridad en RLS
- **Acción:** Ejecutar en Supabase SQL Editor tras DB-01

### DB-03 · Aplicar RLS policies para operators y product_names

- **Archivo:** `sql/rls-operators-product-names.sql`
- **Contexto:** Las tablas `operators` y `product_names` no tienen RLS activo
- **Acción:** Ejecutar el SQL del archivo en Supabase SQL Editor

---

## Deuda Técnica

### DT-01 · Eliminar console.log en producción

- **Problema:** 20+ sentencias `console.log/error` con datos sensibles (auth, productos)
- **Solución:** Reemplazar por un logger condicional (`process.env.NODE_ENV === 'development'`) o eliminarlos
- **Archivos principales:** `src/context/auth-context.tsx`, rutas API de email, product history

### DT-02 · Arreglar errores de TypeScript suprimidos

- **Problema:** `next.config.ts` tiene `ignoreBuildErrors: true` — los errores de TS no bloquean el build
- **Errores conocidos:** parámetros de route handlers (Next.js 15 params como Promise), tipos de Framer Motion
- **Solución:** Arreglar los errores y setear `ignoreBuildErrors: false`

### DT-03 · Arreglar warnings de ESLint suprimidos

- **Problema:** `ignoreDuringBuilds: true` — ESLint no corre en build
- **Solución:** Correr `npm run lint`, arreglar los warnings y habilitarlo en build

### DT-04 · Completar el Repository Pattern (Fase 2)

- **Problema:** `src/data/repositories/repository.factory.ts` tiene 2 métodos marcados como `// TODO: Implement in Fase 2` (Supabase repos para products y holidays)
- **Contexto:** Actualmente React Query hooks van directo a Supabase sin pasar por el repo pattern
- **Decisión a tomar:** ¿Completar el patrón o eliminarlo y dejarlo explícito?

### DT-05 · Migración de datos de localStorage a Supabase (opcional)

- **Contexto:** La app aún soporta localStorage por backward compatibility
- **Archivo de guía:** `docs/database/DATA_MIGRATION_GUIDE.md`
- **Acción:** Evaluar si hay usuarios con datos en localStorage y ejecutar migración

---

## Bugs y Mejoras Puntuales

### BUG-01 · Modal de keyboard shortcuts sin implementar

- **Archivo:** `src/hooks/use-keyboard-shortcuts.ts` línea 54
- **Código:** `// TODO: Show toast or modal with shortcuts`
- **Fix:** Implementar el modal/toast que lista los atajos de teclado disponibles

### BUG-02 · Supabase generated types desactualizados

- **Problema:** Los tipos generados de Supabase no reflejan el esquema actual (tablas operators, product_names, etc.)
- **Fix:** Regenerar con `npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts`

### BUG-03 · Testing checklist de operators/product_names sin verificar

- **Archivo:** `docs/sprints/IMPLEMENTATION-STATUS.md` — sección de Testing Checklist
- **Acción:** Ejecutar los casos de prueba manuales listados allí (duplicados, case-insensitive, espacios)

---

## Mejoras Planificadas

### FEAT-01 · Infraestructura de tests (Jest / Vitest)

- **Problema:** 0% cobertura de tests — sin Jest, sin Vitest, sin archivos `.test.ts`
- **Alcance mínimo:**
  - Unit tests para `src/lib/actions.ts` (CRUD)
  - Unit tests para Zod schemas en `src/lib/types.ts`
  - Integration test para auth flow
- **Stack sugerido:** Vitest + Testing Library (compatible con Next.js App Router)

### FEAT-02 · Rate limiting en API routes

- **Problema:** Las rutas `/api/email/*` y `/api/invitations/*` no tienen rate limiting
- **Riesgo:** Abuso de envío de emails de invitación
- **Solución sugerida:** Upstash Ratelimit + Redis (compatible con Vercel Edge)

### FEAT-03 · Protección CSRF

- **Problema:** No hay verificación de tokens CSRF en las API routes de mutación
- **Solución sugerida:** `next-csrf` o usar el patrón de `SameSite=Strict` cookies

### FEAT-04 · Supabase Realtime (actualizaciones en vivo)

- **Descripción:** Cuando un usuario modifica un producto, otros usuarios conectados ven el cambio sin recargar
- **Implementación:** Supabase Realtime channels + `useEffect` subscription en React Query
- **Prioridad:** Baja (app es de uso interno con pocos usuarios simultáneos)

### FEAT-05 · Sanitización de inputs (XSS prevention)

- **Problema:** Los campos de texto libre (nombre de producto, URLs) no pasan por sanitización explícita
- **Contexto:** Zod valida tipos/longitud pero no escapa HTML
- **Solución:** Agregar `DOMPurify` o `sanitize-html` para campos que renderizan HTML

### FEAT-06 · Export de roadmap a PDF / imagen

- **Descripción:** Permitir exportar la vista de lista o calendario como PDF o PNG para compartir
- **Herramientas:** `html2canvas` + `jsPDF` o `@react-pdf/renderer`

### FEAT-07 · Modo offline / PWA básico

- **Descripción:** Service worker para cachear la app y permitir lectura offline
- **Herramientas:** `next-pwa`

---

## Backlog (sin prioridad definida)

- Notificaciones in-app (además de email) cuando cambia el estado de un producto
- Vista Kanban como tercera opción de visualización
- Comentarios en productos (thread por producto)
- Integración con Slack / webhook para notificaciones de cambios
- Dark mode completo (actualmente parcial)
- Internacionalización (i18n) — actualmente solo español

---

## Completado recientemente

Ver `CHANGELOG.md` para el historial completo de versiones.

- v0.7.0 — Performance indexes, pg_cron keep-alive, fix calendario y feriados
- v0.6.0 — Bulk operations, filtros guardados, exportación de datos
- v0.5.0 — Mejoras iterativas de UI/UX
- v0.4.0 — Rediseño Neobrutalism
- v0.3.0 — Notificaciones email, campos estandarizados
- v0.2.0 — Supabase Auth + PostgreSQL
- v0.1.0 — MVP con localStorage
