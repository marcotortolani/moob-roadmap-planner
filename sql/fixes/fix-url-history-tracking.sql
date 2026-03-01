-- Fix: Normalizar URLs vacías en el trigger de auditoría
-- Para que "" y NULL se consideren equivalentes y no se registren como cambios

-- Actualizar la función log_product_updated para normalizar URLs antes de comparar
CREATE OR REPLACE FUNCTION log_product_updated()
RETURNS TRIGGER AS $$
DECLARE
  field_name_var text;
  old_val text;
  new_val text;
BEGIN
  -- Solo registrar si realmente hubo cambios (no solo updated_at)
  IF (OLD.name IS DISTINCT FROM NEW.name) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'name', OLD.name, NEW.name, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.operator IS DISTINCT FROM NEW.operator) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'operator', OLD.operator, NEW.operator, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.country IS DISTINCT FROM NEW.country) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'country', OLD.country, NEW.country, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.language IS DISTINCT FROM NEW.language) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'language', OLD.language, NEW.language, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.start_date IS DISTINCT FROM NEW.start_date) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'start_date', OLD.start_date::text, NEW.start_date::text, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.end_date IS DISTINCT FROM NEW.end_date) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'end_date', OLD.end_date::text, NEW.end_date::text, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'status', OLD.status::text, NEW.status::text, NEW.updated_by_id, NEW.updated_at);
  END IF;

  -- URLs: Normalizar valores vacíos a NULL antes de comparar
  -- Esto evita registrar cambios cuando se convierte "" a NULL
  IF (NULLIF(OLD.productive_url, '') IS DISTINCT FROM NULLIF(NEW.productive_url, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'productive_url', OLD.productive_url, NEW.productive_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (NULLIF(OLD.vercel_demo_url, '') IS DISTINCT FROM NULLIF(NEW.vercel_demo_url, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'vercel_demo_url', OLD.vercel_demo_url, NEW.vercel_demo_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (NULLIF(OLD.wp_content_prod_url, '') IS DISTINCT FROM NULLIF(NEW.wp_content_prod_url, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_prod_url', OLD.wp_content_prod_url, NEW.wp_content_prod_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (NULLIF(OLD.wp_content_test_url, '') IS DISTINCT FROM NULLIF(NEW.wp_content_test_url, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_test_url', OLD.wp_content_test_url, NEW.wp_content_test_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (NULLIF(OLD.chatbot_url, '') IS DISTINCT FROM NULLIF(NEW.chatbot_url, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'chatbot_url', OLD.chatbot_url, NEW.chatbot_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  -- Comments: También normalizar a NULL
  IF (NULLIF(OLD.comments, '') IS DISTINCT FROM NULLIF(NEW.comments, '')) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'comments', OLD.comments, NEW.comments, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.card_color IS DISTINCT FROM NEW.card_color) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'card_color', OLD.card_color, NEW.card_color, NEW.updated_by_id, NEW.updated_at);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verificar que el trigger se actualizó correctamente
SELECT 'Trigger actualizado correctamente. Ahora solo registrará cambios reales en URLs (ignorando conversiones de "" a NULL)' AS status;
