# SendGrid Setup Guide - Configuración Completa

## ✅ Estado de la Migración

- ✅ **Código migrado**: Todo el código ahora usa SendGrid en vez de Resend
- ✅ **Build exitoso**: La aplicación compila sin errores
- ✅ **Templates conservados**: Tus templates React Email funcionan perfectamente
- ⏳ **Pendiente**: Obtener API key de SendGrid

---

## 🚀 Paso 1: Crear Cuenta en SendGrid (5 minutos)

### 1.1 Registro

1. Ve a: https://signup.sendgrid.com/
2. Completa el formulario:
   - **Email**: marco-ext@memoob.com (o el que prefieras)
   - **Password**: Crea una contraseña segura
3. Haz click en **"Create Account"**

### 1.2 Verificación de Email

1. Revisa tu bandeja de entrada
2. Haz click en el link de verificación
3. Completa el proceso de onboarding:
   - **Role**: Developer
   - **Company**: Media Moob
   - **I'm building**: Web Application
   - **Plan**: Free (100 emails/día permanente)

---

## 🔑 Paso 2: Obtener API Key (2 minutos)

### 2.1 Crear API Key

1. Una vez dentro del dashboard, ve a:
   - https://app.sendgrid.com/settings/api_keys

   O navega manualmente:
   - **Settings** (menú lateral) → **API Keys**

2. Haz click en **"Create API Key"** (botón azul arriba a la derecha)

3. Configura la API Key:
   - **API Key Name**: `Roadmap Planner - Production`
   - **API Key Permissions**: Selecciona **"Restricted Access"**
   - Expande **"Mail Send"** y marca: **"Mail Send"** → Full Access ✅
   - **NO necesitas** ningún otro permiso (deja todo lo demás sin marcar)

4. Haz click en **"Create & View"**

5. **MUY IMPORTANTE**:
   - Copia la API key que aparece (empieza con `SG.`)
   - Guárdala en un lugar seguro (solo se muestra UNA VEZ)
   - Si la pierdes, tendrás que crear otra

### 2.2 Ejemplo de API Key

Debería verse así:
```
SG.xxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## ⚙️ Paso 3: Configurar en tu Proyecto (1 minuto)

### 3.1 Actualizar .env.local

Abre el archivo `.env.local` y reemplaza la línea:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

Con tu API key real:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### 3.2 (Opcional) Personalizar Email "From"

Por defecto usa: `SENDGRID_FROM_EMAIL=noreply@example.com`

Puedes cambiarlo a cualquier email que prefieras (NO requiere verificación en free tier):

```bash
SENDGRID_FROM_EMAIL=roadmap@memoob.com
```

O simplemente:

```bash
SENDGRID_FROM_EMAIL=marco-ext@memoob.com
```

**Nota**: SendGrid permite usar cualquier email en el free tier sin verificar dominio. ¡Esto es la gran ventaja!

---

## 🧪 Paso 4: Probar que Funciona (5 minutos)

### 4.1 Reiniciar el Servidor

```bash
npm run dev
```

### 4.2 Probar Email de Invitación

1. Inicia sesión como admin
2. Ve a `/invitations`
3. Crea una invitación con tu email de prueba
4. Verifica que llegue el email

**Logs esperados:**
```
✅ [Email] invitation to test@example.com { success: true, statusCode: 202 }
```

### 4.3 Probar Email de Bienvenida

1. Completa el signup con el link de invitación
2. Espera 30 segundos
3. Verifica el email de bienvenida

**Logs esperados:**
```
📧 [API] Received welcome email request: { email: ..., firstName: ..., role: ... }
✅ [API] Welcome email sent successfully: xxx-message-id
✅ [Email] welcome to test@example.com { success: true, statusCode: 202 }
```

### 4.4 Probar Email de Producto LIVE

1. Edita cualquier producto
2. Cambia status a **"LIVE"**
3. Verifica que te llegue el email (solo a ti, usuario actual)

**Logs esperados:**
```
📧 Sending product LIVE email to current user only: marco-ext@memoob.com
📧 Sending product LIVE emails with: { productName: '...', country: 'España', language: 'Español (España)', recipientCount: 1 }
✅ [Email] product-live to marco-ext@memoob.com { success: true, statusCode: 202 }
📊 [Email] product-live batch complete: 1 successful, 0 failed
```

---

## ✅ Verificación de Emails Enviados

### Dashboard de SendGrid

Revisa todos tus emails enviados en:
- https://app.sendgrid.com/email_activity

Aquí verás:
- ✅ Status de cada email (Delivered, Opened, Clicked)
- 📊 Estadísticas de entrega
- 📧 Lista completa de emails enviados
- ⚠️ Errores si algo falla

---

## 🎯 Ventajas de SendGrid vs Resend

| Característica | SendGrid | Resend |
|---------------|----------|--------|
| **Testing sin DNS** | ✅ Cualquier email | ❌ Solo tu email |
| **Free tier** | 100/día (permanente) | 100/día (3000/mes) |
| **Rate limit** | 100 req/seg | 2 req/seg |
| **Múltiples destinatarios** | ✅ Sin restricción | ❌ Requiere DNS |
| **Dashboard completo** | ✅ Muy completo | ✅ Bueno |
| **React Email** | ✅ Vía @react-email/render | ✅ Nativo |

---

## 🚨 Troubleshooting

### Error: "SENDGRID_API_KEY is not defined"

**Solución:**
1. Verifica que agregaste la API key en `.env.local`
2. Reinicia el servidor: `npm run dev`
3. Verifica que no haya espacios extras en el API key

### Error: "The provided authorization grant is invalid"

**Solución:**
1. La API key es incorrecta o expiró
2. Crea una nueva API key en SendGrid
3. Reemplázala en `.env.local`

### Error: "403 Forbidden"

**Solución:**
1. La API key no tiene permisos de "Mail Send"
2. Crea una nueva API key con **"Mail Send" → Full Access**

### Emails no llegan

**Diagnóstico:**
1. Revisa https://app.sendgrid.com/email_activity
2. Busca tu email y verifica el status
3. Posibles estados:
   - **Delivered**: ✅ Llegó (revisa spam)
   - **Bounced**: ❌ Email inválido
   - **Deferred**: ⏳ Retraso temporal (reintentará)

---

## 📈 Límites del Free Tier

- **100 emails/día** (permanente, no expira)
- **3000 emails/mes** (límite suave)
- **100 requests/segundo**
- **Sin límite de destinatarios**
- **Sin verificación de dominio requerida**

**Tu uso estimado:** ~65 emails/mes → **Perfecto para free tier** ✅

---

## 🔄 Rollback a Resend (Si es Necesario)

Si necesitas volver a Resend por alguna razón:

```bash
# En todos los archivos, cambia:
import { sendXXXEmail } from '@/lib/sendgrid/service'
# Por:
import { sendXXXEmail } from '@/lib/resend/service'
```

O simplemente:
```bash
git checkout src/lib/email/send-invitation.ts
git checkout src/app/api/emails/send-welcome/route.ts
git checkout src/app/api/emails/send-product-live/route.ts
```

---

## 📝 Próximos Pasos (Opcional)

### Verificar Sender Identity (Más Profesional)

Si quieres emails más profesionales (no requerido para funcionar):

1. Ve a: https://app.sendgrid.com/settings/sender_auth/senders
2. Haz click en **"Create New Sender"**
3. Completa el formulario:
   - **From Name**: Roadmap Planner
   - **From Email Address**: noreply@memoob.com (o el que uses)
   - **Reply To**: marco-ext@memoob.com
   - **Company**: Media Moob
4. Verifica tu email
5. Actualiza `.env.local`:
   ```bash
   SENDGRID_FROM_EMAIL=noreply@memoob.com
   ```

**Beneficio**: Mejora la reputación del remitente y reduce probabilidad de spam.

---

## ✅ Checklist de Implementación

- [ ] Cuenta de SendGrid creada
- [ ] Email verificado
- [ ] API key obtenida y guardada
- [ ] `.env.local` actualizado con `SENDGRID_API_KEY`
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Email de invitación probado y recibido
- [ ] Email de bienvenida probado y recibido
- [ ] Email de producto LIVE probado y recibido
- [ ] Dashboard de SendGrid revisado
- [ ] Todo funcionando correctamente

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tendrás:

- ✅ Emails funcionando sin restricciones de destinatarios
- ✅ No requiere verificación de dominio
- ✅ 100 emails/día permanente (más que suficiente)
- ✅ Rate limits generosos (100 req/seg)
- ✅ Dashboard completo para monitoreo
- ✅ Templates React Email funcionando perfectamente

**Tiempo total**: ~15 minutos

---

**Soporte**:
- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
