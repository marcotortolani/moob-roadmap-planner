-- Limpiar registros de historial que muestran cambios de URLs cuando en realidad
-- solo se convirtió de "" (empty string) a NULL (sin cambio real de contenido)

-- Eliminar registros donde old_value y new_value son funcionalmente equivalentes:
-- - old_value = "" y new_value = NULL
-- - old_value = NULL y new_value = ""
-- - old_value = "(sin URL)" y new_value = "N/A" (artefactos del bug anterior)

DELETE FROM product_history
WHERE change_type = 'UPDATED'
  AND field_name IN ('productive_url', 'vercel_demo_url', 'wp_content_prod_url', 'wp_content_test_url', 'chatbot_url')
  AND (
    -- Caso 1: old_value es vacío y new_value es NULL (conversión de "" a NULL)
    (COALESCE(old_value, '') = '' AND COALESCE(new_value, '') = '')
    OR
    -- Caso 2: Cambios que solo involucran NULL o vacío en ambos lados
    (old_value IN ('', '(sin URL)', 'N/A') AND new_value IN ('', '(sin URL)', 'N/A', NULL))
    OR
    (old_value IS NULL AND new_value IN ('', '(sin URL)', 'N/A'))
  );

-- Mostrar cuántos registros se eliminaron
SELECT 'Registros de historial incorrectos eliminados exitosamente' AS status;

-- Verificar que no quedaron registros duplicados
SELECT
  product_id,
  field_name,
  COUNT(*) as registros_duplicados
FROM product_history
WHERE change_type = 'UPDATED'
  AND changed_at > NOW() - INTERVAL '1 day'
GROUP BY product_id, field_name, changed_at
HAVING COUNT(*) > 1;
