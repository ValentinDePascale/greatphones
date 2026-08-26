# Runbook de Producción — GreatPhones

## Stack
- Next.js 16.2.1 (App Router) + Express custom server (server.js) + Socket.IO
- PostgreSQL: Neon (serverless)
- Redis: Upstash
- ORM: Prisma 7.8
- Auth: NextAuth 4.24 + cookie JWT custom (gp-session)
- Storage: Cloudinary
- Email: Nodemailer (Gmail) + Resend
- Pagos: MercadoPago SDK + Webhooks
- Facturación: @ramiidv/arca-facturacion (ARCA/AFIP)

## Variables de entorno críticas
```
DATABASE_URL=                  # Postgres connection (Neon)
NEXTAUTH_SECRET=               # 64+ chars hex
NEXTAUTH_URL=                  # https://greatphones.com.ar
GOOGLE_CLIENT_ID / SECRET
CLOUDINARY_* (cloud_name, api_key, api_secret)
EMAIL_USER / EMAIL_PASS        # Gmail app password
RESEND_API_KEY
REDIS_URL                      # Upstash
ARCA_CUIT / ARCA_CERT / ARCA_KEY / ARCA_PTO_VTA / ARCA_PRODUCTION
ALLOWED_DEV_ORIGINS
```

---

## Deploy inicial

```bash
# 1. Instalar deps
pnpm install

# 2. Aplicar migraciones pendientes
npx prisma migrate deploy

# 3. Generar cliente Prisma
npx prisma generate

# 4. Build
pnpm build

# 5. Iniciar (en Vercel/Railway/etc.)
pnpm start
```

## Aplicar una nueva migración localmente

```bash
# Después de editar prisma/schema.prisma:
npx prisma migrate dev --name <nombre_descriptivo>
# Esto crea el archivo en prisma/migrations/<timestamp>_<name>/migration.sql
# y lo aplica a la DB de desarrollo.

# Para producción:
npx prisma migrate deploy
```

## Verificar estado de migraciones

```bash
npx prisma migrate status
```

## Rollback de migración (NO automático en prod)

```bash
# 1. Marcar migración como rolled back manualmente
npx prisma migrate resolve --rolled-back <migration_name>

# 2. Revertir SQL manualmente con cuidado
psql $DATABASE_URL -f revert.sql
```

## Verificar que el schema está sincronizado

```bash
npx prisma studio  # Abre GUI web en http://localhost:5555
```

---

## Procedimientos de emergencia

### Si Neon se cae
1. Verificar status en https://neonstatus.com
2. Si es outage regional: esperar restauración automática
3. Si persiste > 30 min: evaluar migración temporal a otro provider
4. Activar modo "solo lectura" en frontend (opcional)

### Si ARCA cae
1. Verificar status en https://www.arca.gob.ar
2. Las cotizaciones nuevas siguen entrando al sistema
3. Las aprobaciones se aprueban sin factura (campo warning)
4. Cuando vuelva ARCA, facturar manualmente desde /admin/cotizaciones

### Si MercadoPago cae
1. El checkout queda habilitado pero no completa pagos
2. Los webhooks se pierden → revisar manualmente pagos recibidos
3. Cuando vuelva: webhook replay o reconciliación manual

### Si Redis (Upstash) se cae
1. BullMQ se para → jobs en cola se pierden
2. Rate-limit falla → usuarios pueden abusar temporalmente
3. Reiniciar queue worker cuando vuelva

---

## Comandos útiles

```bash
# Ver logs en producción (Vercel)
vercel logs --prod

# Ver logs del server custom (Railway/Render)
railway logs

# Conectar a DB directamente
psql $DATABASE_URL

# Reset completo de DB (¡CUIDADO, BORRA TODO!)
npx prisma migrate reset

# Ver tamaño de tablas
psql $DATABASE_URL -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(tablename::regclass) DESC;"
```

---

## Contactos de soporte

| Servicio | Soporte | SLA |
|----------|---------|-----|
| Neon | support@neon.tech | Free: best-effort, Pro: 24h |
| Vercel | support.vercel.com | Hobby: community, Pro: 24h |
| Cloudinary | support.cloudinary.com | Free: community, Paid: 24h |
| MercadoPago | developers.mercadopago.com.ar | 24/7 |
| ARCA/AFIP | 0800-999-2346 | Lun-Vie 9-18 |

---

## Scripts de mantenimiento

### Cron diario: verificar salud
```typescript
// app/api/cron/health/route.ts
// GET a /api/health → debe devolver {ok: true}
// Si falla, alertar vía email/Slack
```

### Cron semanal: limpiar cotizaciones abandonadas
```typescript
// DELETE FROM "Quote" WHERE status='PENDING' AND "createdAt" < NOW() - INTERVAL '90 days'
```

### Cron mensual: backup manual
```bash
pg_dump $DATABASE_URL > backups/backup_$(date +%Y%m%d).sql
```

---

## Smoke tests pre-deploy

```bash
# 1. Health check
curl https://greatphones.com.ar/api/health

# 2. Endpoint público
curl https://greatphones.com.ar/api/products?limit=1

# 3. Verificar ARCA
curl -X POST https://greatphones.com.ar/api/admin/test-arca \
  -H "Cookie: gp-session=..."

# 4. Verificar scanner (manual en navegador)
# Abrir /scan desde celular, apuntar a QR de prueba
```
