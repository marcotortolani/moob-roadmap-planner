-- sql/create-performance-indexes.sql
-- Performance indexes para queries frecuentes
-- Ejecutar en Supabase SQL Editor
-- Ganancia esperada: ~300ms de reducción por query

-- 1. Índice único en users.email (búsquedas de usuario por email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email);

-- 2. Índice en users.role (filtrado de usuarios por rol)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users(role);

-- 3. Índice único en invitations.token (validación de tokens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token
  ON public.invitations(token);

-- 4. Índice compuesto en invitations (email + status)
CREATE INDEX IF NOT EXISTS idx_invitations_email_status
  ON public.invitations(email, status);

-- 5. Índice en operators.normalized_name (búsqueda de operadores)
CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_normalized_name
  ON public.operators(normalized_name);

-- 6. Índice en product_names.normalized_name (búsqueda de nombres)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_names_normalized_name
  ON public.product_names(normalized_name);

-- 7. Índice en products para filtros comunes
CREATE INDEX IF NOT EXISTS idx_products_status
  ON public.products(status);

CREATE INDEX IF NOT EXISTS idx_products_operator
  ON public.products(operator);

CREATE INDEX IF NOT EXISTS idx_products_dates
  ON public.products(start_date, end_date);

-- Verificar índices creados
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar (RUN)
-- 4. Verificar que los 9 índices se crearon correctamente
-- 5. La query de verificación al final mostrará todos los índices

-- IMPACTO ESPERADO:
-- - Queries por email: 300ms → 50ms (-83%)
-- - Queries por token: 250ms → 40ms (-84%)
-- - Queries por rol: 200ms → 30ms (-85%)
-- - Filtros de productos: 150ms → 40ms (-73%)
