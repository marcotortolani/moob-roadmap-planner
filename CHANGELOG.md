# Changelog

Todos los cambios notables de este proyecto están documentados aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

---

## [0.8.7] - 2026-03-10

### Fixed

- **Auth resiliente con localStorage cache — fix definitivo para Chrome/Vercel (`src/context/auth-context.tsx`)** — La causa raíz del skeleton/"0 de 0 productos" tras reload en Vercel era que `createBrowserClient` depende de `document.cookie` para leer la sesión, y Chrome no expone correctamente las cookies auth al JavaScript tras reload (Firefox y Safari limpio sí funcionan). Implementado patrón de caché en localStorage (confirmado en proyecto de referencia Workmap360/AUTH-GUIDE.md): el usuario se persiste en `rp-cached-user` y se restaura instantáneamente en el `useState` initializer, eliminando la dependencia de cookies para la hidratación. `onAuthStateChange('INITIAL_SESSION')` reemplaza el `initAuth()` manual y valida/actualiza el cache en background.

- **Cookie options explícitas para Chrome (`src/lib/supabase/client.ts`, `src/middleware.ts`, `src/lib/supabase/server.ts`)** — Agregado `secure: true`, `sameSite: 'lax'`, `httpOnly: false`, `path: '/'` en los tres puntos donde se crean/setean cookies de Supabase (browser client, middleware, server client). Chrome puede silenciosamente ignorar cookies sin el flag `secure` en orígenes HTTPS. La consistencia entre server y client previene que el middleware setee atributos distintos a los que `createBrowserClient` espera.

- **Cross-tab logout sync (`src/context/auth-context.tsx`)** — Listener de `StorageEvent` detecta cuando otra pestaña hace logout (elimina `rp-cached-user`) y redirige a `/login` automáticamente.

- **Fallback logout con delay (`src/components/header.tsx`)** — El botón "Cerrar Sesión" fallback (visible cuando `user=null && !loading`) ahora espera 2 segundos antes de aparecer, evitando flash innecesario cuando el cached user se restaura instantáneamente.

---

## [0.8.6] - 2026-03-10

### Fixed

- **Auth rota en Vercel: `user=null` tras page load (`src/context/auth-context.tsx`)** — `getUser()` (introducido en v0.8.4) rompía la inicialización en producción: `createBrowserClient` no encontraba la sesión en cookies por diferencias de atributos (`Secure`, `SameSite`) entre HTTPS Vercel y localhost, devolviendo `null` sin hacer ningún request de red. Revertido a `getSession()` que lee la sesión ya refrescada por el middleware desde cookies del browser. Los hangs previos de `getSession()` (pre-v0.8.2) estaban causados por race conditions en token refresh — corregidos en v0.8.2 con el patrón `getAll/setAll`. La validación JWT de seguridad se mantiene en el middleware (server-side `getUser()` en cada request).
- **Opciones auth explícitas en browser client (`src/lib/supabase/client.ts`)** — `createBrowserClient` ahora declara explícitamente `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true` para evitar variaciones por versión en Vercel prod.

---

## [0.8.5] - 2026-03-10

### Fixed

- **`TOKEN_REFRESHED` con sign-out verdadero (`src/context/auth-context.tsx`)** — Cuando `fetchUserData` fallaba y `getSession()` confirmaba que la sesión estaba realmente expirada, `invalidateQueries()` se ejecutaba en el bloque `finally` antes del `return`, disparando queries con token inválido. Corregido con flag `signedOut` que evita `invalidateQueries()` solo cuando ocurre un sign-out real.
- **CSRF + rate limiting en endpoints de admin** — Agregado check de origen (`isSameOrigin`) y rate limiting a los endpoints que faltaban:
  - `POST /api/invitations/revoke` — CSRF check + 30 revocaciones/hora por admin
  - `POST /api/invitations/delete` — CSRF check + 30 eliminaciones/hora por admin
  - `POST /api/users/delete` — rate limiting de 10 eliminaciones/hora por admin
  - `POST /api/profile/update` — CSRF check + validación de longitud de nombre (1-200 chars)
- **Nuevos presets en `RATE_LIMITS` (`src/lib/rate-limit.ts`)** — Agregados `invitationRevoke`, `invitationDelete`, `userDelete`.

---

## [0.8.4] - 2026-03-10

### Fixed

- **Skeleton infinito — fix definitivo (dos bugs independientes)**

  **Bug 1 — `getSession()` cuelga en producción (`src/context/auth-context.tsx`):**
  `initAuth()` usaba `getSession()` que lee cookies locales y cuelga intermitentemente en Vercel (cold starts, edge network). Reemplazado por `getUser()` que valida el token server-side y siempre resuelve. Sin `router.push('/login')` en fallo — el middleware es la autoridad de enrutamiento (el patrón `getUser` + `router.push` causaba el loop de v0.8.2).

  **Bug 2 — React Query v5: query desactivada = `isPending: true` eterno (`src/hooks/queries/use-products.ts`):**
  React Query v5 devuelve `isPending: true` para queries con `enabled: false`. Cuando `user` es `null`, la query se desactiva pero `isPending` permanece `true`, causando skeleton infinito. `useProducts` ahora envuelve `useQuery` y expone `isPending` personalizado: `authLoading || query.isLoading`. `isLoading` solo es `true` cuando la query está activamente fetching — nunca cuando está desactivada.

---

## [0.8.2] - 2026-03-10

### Fixed

- **Skeleton infinito post-inactividad (fix definitivo en servidor)** — Corregidos dos bugs encadenados en la capa de servidor que persistían tras los fixes del cliente en v0.8.1.

  **Bug 1 — Middleware cookie handler (causa raíz):** El patrón `set/remove` recreaba el objeto `response` en cada llamada al manejar un token refresh, descartando los cookies chunkeados previos. Cuando Supabase rota el access token (TTL: 1h) escribe múltiples cookies en base64; solo el último sobrevivía. El browser recibía la sesión truncada → `getCurrentUser()` fallaba con "Auth session missing!" en servidor → `setUser(null)` silencioso en cliente. Corregido con el patrón `getAll/setAll` (Supabase SSR v0.5+) que escribe todos los cookies de una vez sobre el mismo objeto `response` (`src/middleware.ts`, `src/lib/supabase/server.ts`).

  **Bug 2 — `initAuth()` sin fallback a login:** Cuando el server action `getCurrentUser()` devolvía error, `initAuth()` hacía `setUser(null)` sin redirigir a `/login`, dejando al usuario en la página protegida con skeleton eterno. Reemplazado por `supabase.auth.getUser()` del browser client (maneja refresh automático) con redirect explícito a `/login` en caso de fallo (`src/context/auth-context.tsx`).

---

## [0.8.1] - 2026-03-10

### Fixed

- **Skeleton infinito post-inactividad (bug de producción)** — Tras horas de inactividad, la app quedaba congelada en estado de carga infinita sin hacer ninguna petición de red. El problema eran tres fallos compuestos del lado del cliente:

  - **RC1:** El `networkMode: 'online'` por defecto de React Query pausaba silenciosamente todas las queries cuando `navigator.onLine` era brevemente `false` al despertar el dispositivo. El evento `online` del navegador a veces nunca se dispara tras un sueño largo → queries pausadas indefinidamente. Corregido con `networkMode: 'always'` en los defaults del QueryClient (`src/lib/react-query/client.ts`).



  - **RC2:** `invalidateQueries()` en el handler de `TOKEN_REFRESHED` solo se ejecutaba si `fetchUserData` tenía éxito. Un error transitorio de DB dejaba la caché de React Query vacía sin trigger para refetch. Corregido moviendo `invalidateQueries()` a un bloque `finally` para que siempre se ejecute mientras la sesión sea válida (`src/context/auth-context.tsx`).

  - **RC3:** `handleVisibilityChange` era un no-op cuando la sesión era válida pero el token no había expirado (y por tanto `TOKEN_REFRESHED` nunca se disparaba). Corregido llamando a `invalidateQueries()` tras confirmar sesión válida al recuperar foco del tab (`src/context/auth-context.tsx`).

  - **RC4 (defensivo):** Añadido `refetchOnWindowFocus: 'always'` en `useProducts` para garantizar un refetch en background al recuperar foco independientemente del staleTime (`src/hooks/queries/use-products.ts`).

---

## [0.8.0] - 2026-03-09

### Added

- **Reenvío de invitaciones expiradas/revocadas** — Nuevo endpoint `POST /api/invitations/resend` que regenera el token, resetea la expiración a 7 días, actualiza el status a PENDING y reenvía el email via SendGrid. Registra evento en `audit_logs` con `metadata.resent = true`.
- **Eliminación de invitaciones** — Nuevo endpoint `POST /api/invitations/delete` y opción "Eliminar" en el dropdown de acciones para todos los estados de invitación, con AlertDialog de confirmación.
- **Feedback de email en reenvío** — Si el email falla al enviarse, el toast informa explícitamente en lugar de mostrar éxito silencioso.

### Fixed

- **Columna "Enviada" no se actualizaba al reenviar** — Ahora se deriva de `expires_at - 7 días` en lugar de `created_at`, reflejando la fecha del último envío.
- **Columna "Expira" calculaba mal la fecha tras reenvío** — Ahora usa `expires_at` directamente en lugar de `created_at + 7 días`.

---

## [0.7.1] - 2026-03-09

### Fixed

- **Race condition en TOKEN_REFRESHED (skeleton infinito)** — Al dejar el tab abierto 1+ horas, el access token expiraba y al volver el handler `TOKEN_REFRESHED` llamaba a `getCurrentUser()` (server action) que competía con la propagación de cookies, devolviendo `null` y seteando `user = null`. Esto deshabilitaba React Query mostrando skeleton para siempre. Corregido reemplazando el server action por `fetchUserData(session.user)` que usa el cliente Supabase del browser con el token recién refrescado y ya tiene retry logic incorporado.
- **Botón de logout inaccesible con `user = null`** — Cuando la race condition ocurría, el menú de usuario (incluido logout) quedaba oculto por el guard `{user && ...}`. Se agregó un botón fallback "Cerrar Sesión" visible siempre que `!user && !loading`.

---

## [0.7.0] - 2026-03-07

- Optimizaciones de performance en base de datos (9 índices)
- Migración de keep-alive a pg_cron con cliente admin
- Corrección de seguridad y advisories de Supabase (RLS, índices)
- Optimización de Google Fonts con next/font (mejora LCP)
- Fixes: calendario, feriados, comentarios en modal, selector de mes

## [0.6.0] - Sprint 7: Features Avanzados

- Operaciones en bulk (selección múltiple)
- Filtros guardados
- Exportación de datos
- Mejoras de responsive

## [0.5.0] - Sprints 1-4: Mejoras iterativas

- Mejoras de UI/UX en múltiples componentes
- Correcciones de estilos y comportamiento

## [0.4.0] - Rediseño Neobrutalism

- Nuevo sistema de diseño visual (neobrutalism)
- Header y componentes rediseñados con nueva librería

## [0.3.0] - Notificaciones y campos estandarizados

- Integración de email con SendGrid
- Estandarización de campos: operador, idioma, nombre de producto
- Historial de cambios en productos
- Mejoras de filtros y toasts

## [0.2.0] - Integración con Supabase

- Autenticación real con Supabase Auth
- Base de datos PostgreSQL via Prisma
- Triggers y RLS policies
- Retry logic para signup (manejo de latencia en triggers)

## [0.1.0] - MVP inicial

- CRUD completo de productos
- Vista de lista (agrupada por año/trimestre) y vista de calendario
- Filtrado y ordenamiento avanzado (búsqueda, estado, operador, país, idioma, año, trimestre)
- Dashboard con gráficos de distribución (Recharts)
- Gestión de feriados
- Autenticación mock con localStorage
- Persistencia en localStorage
