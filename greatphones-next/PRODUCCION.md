# Great Phones — Checklist de Producción

## 1. Cuentas que necesitás crear (si no tenés)

| Servicio | Link | Plan gratuito | Para qué |
|----------|------|---------------|----------|
| **Vercel** | https://vercel.com | ✅ Sí | Hostear la app Next.js |
| **Cloudflare** | https://dash.cloudflare.com/sign-up | ✅ Sí | DNS, CDN, protección DDoS |
| **Cloudinary** | https://cloudinary.com/register | ✅ Sí | Subir imágenes de productos |
| **Google Cloud Console** | https://console.cloud.google.com | ✅ Sí | Login con Google |
| **Resend** | https://resend.com | ✅ 100 emails/día | Emails transaccionales |
| **Neon** | ✅ Ya tenés | — | Base de datos PostgreSQL |
| **Mercado Pago** | ✅ Ya tenés | — | Pagos |

## 2. Credenciales a obtener (en ese orden)

### Paso 1 — Cloudinary
1. Registrarse en https://cloudinary.com
2. Ir a Dashboard → copiar:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Paso 2 — Google OAuth
1. Ir a https://console.cloud.google.com → Crear proyecto
2. APIs & Services → Credentials → Crear OAuth 2.0 Client ID
3. Tipo: Web application
4. Orígenes autorizados: `https://greatphones.vercel.app`
5. Redirect URIs: `https://greatphones.vercel.app/api/auth/callback/google`
6. Copiar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

### Paso 3 — Mercado Pago (producción)
1. Ir a https://developers.mercadopago.com → Tu app
2. Cambiar de **TEST** a **Producción** (necesitás CUIT y documentación)
3. Copiar:
   - `MP_ACCESS_TOKEN` (productivo, empieza con `APP_USR-`)
   - `MP_PUBLIC_KEY` (productivo)
   - `MP_WEBHOOK_SECRET` → generarlo en Webhooks / Notificaciones

### Paso 4 — Resend (para reemplazar Gmail SMTP)
1. Ir a https://resend.com → API Keys
2. Crear nueva API key → copiar `RESEND_API_KEY`
3. Configurar dominio en Resend (verificarlo)
4. Opcional: reemplazar EMAIL_USER/EMAIL_PASS por Resend (más confiable que Gmail SMTP)

### Paso 5 — NEXTAUTH_SECRET fuerte
```bash
# En tu terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 3. Backups de base de datos

Crear archivo `.github/workflows/db-backup.yml` en el repo con este contenido:

```yaml
name: DB Backup
on:
  schedule:
    - cron: '0 6 * * *'  # 03:00 ARG
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Dump DB
        run: pg_dump "${{ secrets.DATABASE_URL }}" --no-owner --no-acl -f greatphones-$(date +%F).sql
      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: greatphones-$(date +%F)
          path: greatphones-*.sql
```

Y agregar `DATABASE_URL` a los Secrets del repo en GitHub.

## 4. Deploy a Vercel

1. Ir a https://vercel.com/new
2. Importar el repo de GitHub
3. Configurar todas las environment variables (ver abajo)
4. Deploy

**Variables de entorno** (todas obligatorias):

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://greatphones.vercel.app
NEXTAUTH_SECRET=<el nuevo fuerte>

GOOGLE_CLIENT_ID=<de Google Cloud>
GOOGLE_CLIENT_SECRET=<de Google Cloud>

MP_ACCESS_TOKEN=<APP_USR-...>
MP_PUBLIC_KEY=<APP_USR-...>
MP_WEBHOOK_SECRET=<generado en MP>

CLOUDINARY_CLOUD_NAME=<de Cloudinary>
CLOUDINARY_API_KEY=<de Cloudinary>
CLOUDINARY_API_SECRET=<de Cloudinary>

RESEND_API_KEY=<de Resend>
EMAIL_USER=twitchdepa@gmail.com
EMAIL_PASS=<app password>

ALLOWED_DEV_ORIGINS=https://greatphones.vercel.app
```

## 5. Configurar Cloudflare + dominio

1. Comprar dominio en nic.ar (ej: `greatphones.com.ar`)
2. En nic.ar → cambiar nameservers a los de Cloudflare:
   ```
   darl.ns.cloudflare.com
   gwen.ns.cloudflare.com
   ```
3. En Cloudflare Dashboard → Websites → Add site
4. Agregar registro DNS:
   - Tipo: **CNAME**
   - Nombre: `@`
   - Target: `cname.vercel-dns.com`
   - Proxy: ✅ Activado (nube naranja)
5. En Vercel → Dashboard → Domains → agregar `greatphones.com.ar`
6. En Vercel va a pedir verificación → Cloudflare ya lo resuelve

## 6. Post-deploy: verificar

```bash
# 1. La página carga en https://greatphones.com.ar
# 2. Login con Google funciona
# 3. Se puede crear una preferencia de pago en MP
# 4. Webhook de MP recibe notificaciones (configurar URL en MP)
# 5. Se pueden subir imágenes al admin
# 6. Backup automático corre al otro día
```

## 7. Recordatorios importantes

- ❌ **No compartir** `.env.local` — ya está en el repo, rotar `RESEND_API_KEY`
- ❌ **No pushear** a main sin antes verificar build local (`npm run build`)
- ⚠️ **MP Webhook URL**: configurar en MP Developers → Webhooks como `https://greatphones.com.ar/api/webhooks/mercadopago`
- ⚠️ **SSL automático**: Cloudflare lo maneja (Full strict)
- ✅ **Neon** ya tiene point-in-time recovery por 7 días (plan free)
