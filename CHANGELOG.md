# Changelog

Todos los cambios notables de este proyecto están documentados aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

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
