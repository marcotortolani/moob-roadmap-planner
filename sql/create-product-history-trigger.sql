-- Trigger para registrar automáticamente cambios en los productos

-- Función que se ejecuta DESPUÉS de insertar un producto (CREATED)
CREATE OR REPLACE FUNCTION log_product_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_history (
    id,
    product_id,
    change_type,
    field_name,
    old_value,
    new_value,
    changed_by_id,
    changed_at
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    'CREATED',
    NULL,
    NULL,
    NULL,
    NEW.created_by_id,
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función que se ejecuta DESPUÉS de actualizar un producto (UPDATED)
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

  IF (OLD.productive_url IS DISTINCT FROM NEW.productive_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'productive_url', OLD.productive_url, NEW.productive_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.vercel_demo_url IS DISTINCT FROM NEW.vercel_demo_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'vercel_demo_url', OLD.vercel_demo_url, NEW.vercel_demo_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.wp_content_prod_url IS DISTINCT FROM NEW.wp_content_prod_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_prod_url', OLD.wp_content_prod_url, NEW.wp_content_prod_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.wp_content_test_url IS DISTINCT FROM NEW.wp_content_test_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'wp_content_test_url', OLD.wp_content_test_url, NEW.wp_content_test_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.chatbot_url IS DISTINCT FROM NEW.chatbot_url) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'chatbot_url', OLD.chatbot_url, NEW.chatbot_url, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.comments IS DISTINCT FROM NEW.comments) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'comments', OLD.comments, NEW.comments, NEW.updated_by_id, NEW.updated_at);
  END IF;

  IF (OLD.card_color IS DISTINCT FROM NEW.card_color) THEN
    INSERT INTO product_history (id, product_id, change_type, field_name, old_value, new_value, changed_by_id, changed_at)
    VALUES (gen_random_uuid()::text, NEW.id, 'UPDATED', 'card_color', OLD.card_color, NEW.card_color, NEW.updated_by_id, NEW.updated_at);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear los triggers
DROP TRIGGER IF EXISTS product_created_trigger ON products;
CREATE TRIGGER product_created_trigger
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_created();

DROP TRIGGER IF EXISTS product_updated_trigger ON products;
CREATE TRIGGER product_updated_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_updated();

-- Verificar que los triggers se crearon
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'products'
ORDER BY trigger_name;
