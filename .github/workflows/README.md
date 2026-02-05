# GitHub Actions Workflows

## 🤖 Keep Supabase Active

Este workflow automático previene que Supabase pause la base de datos por inactividad en el plan gratuito.

### 📋 ¿Qué hace?

- Ejecuta cada **5 días** automáticamente
- Hace una request HTTP a tu app en Vercel
- El endpoint `/api/cron/keep-alive` hace una query simple a Supabase
- Mantiene la base de datos activa y evita la suspensión

### ⚙️ Configuración Requerida

Necesitas configurar 2 secrets en GitHub:

#### 1. CRON_SECRET

Este es un token de seguridad para autorizar las requests del cron job.

**Generar el secret:**

```bash
# Opción 1: Usar openssl
openssl rand -base64 32

# Opción 2: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Usar un generador online
# https://generate-secret.vercel.app/32
```

**Agregar a GitHub:**

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Name: `CRON_SECRET`
5. Value: Pega el token generado
6. Click "Add secret"

**Agregar a Vercel:**

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Click "Add New"
4. Key: `CRON_SECRET`
5. Value: El mismo token que usaste en GitHub
6. Environments: Selecciona Production, Preview, Development
7. Click "Save"

#### 2. VERCEL_APP_URL

La URL de tu app deployada en Vercel.

**Agregar a GitHub:**

1. Settings → Secrets and variables → Actions
2. Click en "New repository secret"
3. Name: `VERCEL_APP_URL`
4. Value: `https://tu-app.vercel.app` (sin / al final)
5. Click "Add secret"

### 🧪 Probar el Workflow

#### Opción 1: Ejecutar Manualmente

1. Ve a tu repositorio en GitHub
2. Actions → "Keep Supabase Active"
3. Click en "Run workflow"
4. Click en el botón verde "Run workflow"
5. Espera unos segundos y verás la ejecución

#### Opción 2: Probar el Endpoint Directamente

```bash
# Reemplaza los valores
export CRON_SECRET="tu-secret-aqui"
export APP_URL="https://tu-app.vercel.app"

curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/keep-alive"
```

Deberías ver una respuesta como:

```json
{
  "success": true,
  "message": "Database keep-alive successful",
  "userCount": 5,
  "timestamp": "2026-02-05T10:00:00.000Z"
}
```

### 📅 Calendario de Ejecución

- **Frecuencia**: Cada 5 días
- **Hora**: 10:00 AM UTC (7:00 AM Argentina)
- **Zona horaria**: UTC

**Cron schedule**: `0 10 */5 * *`

### 🔍 Monitorear Ejecuciones

1. Ve a tu repositorio en GitHub
2. Pestaña **Actions**
3. Verás todas las ejecuciones del workflow "Keep Supabase Active"
4. Click en una ejecución para ver los logs

### ⚡ Ejecución Manual

Puedes ejecutar el workflow manualmente cuando quieras:

1. Actions → "Keep Supabase Active"
2. "Run workflow" → "Run workflow"

Útil para:

- Probar que funciona después de configurar
- Ejecutar antes de un periodo largo sin desarrollo
- Verificar que el endpoint responde correctamente

### 🚨 Troubleshooting

#### Error 401 (Unauthorized)

- Verifica que `CRON_SECRET` sea el mismo en GitHub y Vercel
- Asegúrate de que no haya espacios extra en el secret

#### Error 500 (Internal Server Error)

- Revisa los logs en Vercel para ver el error específico
- Verifica que las variables de Supabase estén configuradas

#### Workflow no se ejecuta

- Verifica que el workflow esté en la rama `main`
- El cron puede tardar hasta 1 hora en ejecutarse después de la hora programada
- GitHub Actions puede tener delays en schedules de repositorios con poco activity

### 📊 Logs

El workflow registra:

- ✅ Timestamp de ejecución
- ✅ Response del endpoint
- ✅ Cantidad de usuarios (como prueba de query)
- ✅ Estado de éxito/fallo

### 🔒 Seguridad

- ✅ El endpoint requiere autenticación con `CRON_SECRET`
- ✅ No expone información sensible en los logs
- ✅ Solo hace queries de lectura (no modifica datos)

### 💡 Notas

- El free tier de Supabase pausa después de **7 días** sin actividad
- Ejecutamos cada **5 días** para tener margen de seguridad
- Si el proyecto tiene actividad regular (commits, deployments), el cron es backup
- Puedes ajustar la frecuencia editando el cron schedule en el workflow

---

**¿Necesitas ayuda?** Revisa los logs en GitHub Actions o en Vercel para diagnosticar problemas.
