# Email Templates para Supabase

Este directorio contiene templates HTML personalizados para los emails de Supabase Auth.

## 📧 Templates Disponibles

1. **reset-password.html** - Email de recuperación de contraseña
2. **invite-user.html** - Email de invitación de usuario

## 🎨 Características del Diseño

- ✅ Diseño responsive (se adapta a móvil y desktop)
- ✅ Colores de la marca (Slate blue #778899, Soft green #90EE90)
- ✅ Botones con gradientes y sombras modernas
- ✅ Estructura clara con secciones bien definidas
- ✅ Mensajes de seguridad y expiración
- ✅ Enlaces alternativos si el botón no funciona
- ✅ Footer con branding de Media-Moob

## 📝 Cómo Aplicar los Templates en Supabase

### Paso 1: Acceder a Email Templates

1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Email Templates** (en el menú lateral izquierdo)

### Paso 2: Modificar cada Template

#### Para Reset Password:

1. Haz clic en **"Reset Password"** en la lista de templates
2. Cambia el **Subject** (opcional):
   ```
   Recupera tu contraseña - Roadmap Planner
   ```
3. En el editor HTML, **reemplaza todo el contenido** con el código de `reset-password.html`
4. Haz clic en **"Save"**

#### Para Invite User:

1. Haz clic en **"Invite user"** en la lista de templates
2. Cambia el **Subject** (opcional):
   ```
   Te han invitado a Roadmap Planner
   ```
3. En el editor HTML, **reemplaza todo el contenido** con el código de `invite-user.html`
4. Haz clic en **"Save"**

### Paso 3: Probar los Templates

1. **Reset Password**:
   - Ve a `/forgot-password` y solicita un reset
   - Revisa tu email para ver el nuevo diseño

2. **Invite User**:
   - Ve a `/invitations` y envía una invitación
   - El destinatario recibirá el email con el nuevo diseño

## 🔧 Variables Disponibles

Supabase proporciona estas variables que puedes usar en los templates:

- `{{ .ConfirmationURL }}` - URL del enlace de confirmación/acción
- `{{ .Token }}` - Token de verificación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL de tu sitio
- `{{ .Email }}` - Email del usuario

## 🎨 Personalización

### Cambiar Colores

Si quieres ajustar los colores, busca estos valores en el HTML:

- **Color primario** (azul slate): `#778899` y `#5a6a7a`
- **Color secundario** (verde suave): `#90ee90` y `#7ad67a`
- **Fondo**: `#f0f8ff`

### Cambiar Textos

Puedes modificar:
- Títulos y mensajes
- Texto de los botones
- Notas de seguridad
- Footer con copyright

## 📱 Vista Previa

Los templates están optimizados para verse bien en:
- ✅ Gmail (web y app)
- ✅ Outlook (web y desktop)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Otros clientes populares

## 🚨 Notas Importantes

1. **No uses CSS externo**: Supabase no permite cargar CSS de URLs externas por seguridad
2. **Usa estilos inline**: Todos los estilos deben estar inline (`style=""`)
3. **Prueba en múltiples clientes**: Los emails se ven diferente en cada cliente
4. **Mantén el `{{ .ConfirmationURL }}`**: Es esencial para que los enlaces funcionen

## 🔄 Actualizar Templates

Si haces cambios en estos archivos HTML:
1. Copia el contenido actualizado
2. Ve a Supabase Dashboard → Email Templates
3. Pega el nuevo código
4. Guarda y prueba

---

**Nota**: Los templates están en español porque la app está diseñada para uso interno en Media-Moob.
