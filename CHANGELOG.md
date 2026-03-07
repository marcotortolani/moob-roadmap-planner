# Changelog

Todos los cambios notables de este proyecto están documentados aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

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
