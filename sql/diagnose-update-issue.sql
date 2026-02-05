-- DIAGNÓSTICO: Por qué no funciona el UPDATE

-- 1. Ver todos los triggers en la tabla users
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 2. Ver las políticas RLS actuales
SELECT
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- 3. PROBAR UPDATE MANUAL (reemplaza el auth_user_id con el tuyo)
-- Este UPDATE debería funcionar instantáneamente si RLS está bien configurado
UPDATE users
SET
  first_name = 'Marco',
  last_name = 'Test',
  updated_at = now()
WHERE auth_user_id = '174b81d5-ec95-4b3e-8ecf-6ce471342c75';

-- 4. Ver el resultado
SELECT id, email, first_name, last_name, role, updated_at
FROM users
WHERE auth_user_id = '174b81d5-ec95-4b3e-8ecf-6ce471342c75';

-- 5. Si el UPDATE manual funcionó, el problema es en el cliente Supabase JS
-- Si el UPDATE manual también se colgó, el problema es RLS o triggers
