# Opciones de Hosting - Great Phones

Comparativa de plataformas para alojar la aplicación.

---

## Stack actual

- **Frontend**: Next.js 16 + Vanilla JS (SPA)
- **Backend**: Node.js + Socket.IO (WebSocket)
- **Base de datos**: PostgreSQL via Neon (managed)
- **ORM**: Prisma 7.6

---

## Requisitos de la app

| Requisito | Importancia |
|-----------|-------------|
| Node.js runtime | Obligatorio (Next.js, Socket.IO, Prisma) |
| WebSockets (Socket.IO) | Obligatorio (chat en tiempo real) |
| PostgreSQL | Obligatorio (Prisma + schema existente) |
| Persistent connections | Obligatorio (Socket.IO no funciona en serverless) |
| Archivos estáticos | Necesario (imágenes, uploads) |
| CI/CD | Deseable (deploy automático desde GitHub) |

---

## Comparativa de Plataformas

### Render.com (actual)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://render.com |
| **Tier free** | Sí (512MB RAM, se duerme tras 15min de inactividad) |
| **Node.js** | Sí |
| **WebSockets** | Sí |
| **PostgreSQL** | No incluido (usar Neon, Supabase, etc.) |
| **Cold start** | Lento (30-60s al despertar) |
| **CI/CD** | Sí (auto-deploy desde GitHub) |
| **Precio** | Free → $7/mes (Starter) → $25/mes (Standard) |
| **Ventajas** | Ya configurado, funciona, WebSockets nativos |
| **Desventajas** | Cold start lento, free tier limitado, se duerme |

---

### Railway

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://railway.app |
| **Tier free** | $5 de crédito mensual gratis |
| **Node.js** | Sí |
| **WebSockets** | Sí |
| **PostgreSQL** | Sí (addon incluido, cobra por uso) |
| **Cold start** | Rápido (no se duerme en paid) |
| **CI/CD** | Sí (auto-deploy desde GitHub) |
| **Precio** | Free ($5 crédito) → Usage-based ($5-20/mes typical) |
| **Ventajas** | Más rápido que Render, PostgreSQL incluido, CLI local, métricas |
| **Desventajas** | Si se acaba el crédito, cobra, DB también cobra por uso |

---

### Vercel

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://vercel.com |
| **Tier free** | Sí (generoso para hobby) |
| **Node.js** | Sí (pero serverless, no persistente) |
| **WebSockets** | No nativo (necesitar servicio externo) |
| **PostgreSQL** | No incluido (Neon, PlanetScale, etc.) |
| **Cold start** | Mínimo (edge functions) |
| **CI/CD** | Sí (el mejor de todos) |
| **Precio** | Free → $20/mes (Pro) |
| **Ventajas** | Deploy instantáneo, previews PR, edge network, optimizado para Next.js |
| **Desventajas** | Serverless = no persiste estado, Socket.IO no funciona directamente, requiere reescribir el chat |

---

### Cloudflare Pages

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://pages.cloudflare.com |
| **Tier free** | Sí (muy generoso, 500 builds/mes) |
| **Node.js** | No (solo estático o Workers) |
| **WebSockets** | No nativo (requiere Durable Objects) |
| **PostgreSQL** | No (usar D1, SQLite) |
| **Cold start** | N/A (CDN edge) |
| **CI/CD** | Sí (GitHub/GitLab integration) |
| **Precio** | Free → $5/mes (Pro) |
| **Ventajas** | Extremadamente rápido (CDN global), bandwidth gratis |
| **Desventajas** | No soporta Node.js, requiere reescribir backend completo, migrar DB |

---

### Cloudflare Workers + Durable Objects

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://workers.cloudflare.com |
| **Tier free** | 100k requests/día |
| **Node.js** | No (V8 isolates, API compatible parcialmente) |
| **WebSockets** | Sí (via Durable Objects) |
| **PostgreSQL** | No (D1 = SQLite) |
| **Cold start** | Casi nulo (edge) |
| **CI/CD** | Sí (Wrangler CLI) |
| **Precio** | Free → $5/mes |
| **Ventajas** | Ultra rápido, edge computing, WebSocket via Durable Objects |
| **Desventajas** | No es Node.js (V8 isolates), requiere migrar Prisma a Drizzle/ORM compatible, migrar PostgreSQL a D1, reescribir mucho código |

---

### Fly.io

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://fly.io |
| **Tier free** | 3 shared-cpu-1x (256MB) gratis |
| **Node.js** | Sí (Docker containers) |
| **WebSockets** | Sí |
| **PostgreSQL** | Sí (Fly Postgres, addon) |
| **Cold start** | Rápido (containers persistentes) |
| **CI/CD** | Sí (fly deploy) |
| **Precio** | Free → $5-15/mes |
| **Ventajas** | Containers completos, PostgreSQL incluido, global deployment, Machines API |
| **Desventajas** | Curva de aprendizaje (Docker), free tier limitado |

---

### Supabase (solo DB)

| Aspecto | Detalle |
|---------|---------|
| **URL** | https://supabase.com |
| **Uso** | Solo como proveedor de PostgreSQL (no como hosting de app) |
| **Tier free** | 500MB DB, 1GB storage |
| **Ventajas** | PostgreSQL managed, dashboard, auth, storage |
| **Desventajas** | No hostea la app, solo la DB |

---

## Resumen Comparativo

| Plataforma | Node.js | WS | DB | Free tier | Velocidad | Facilidad | Costo aprox |
|------------|---------|-----|-----|-----------|-----------|-----------|-------------|
| **Render** (actual) | ✅ | ✅ | Externa | ✅ | ⭐⭐ | ⭐⭐⭐ | Free-$7/mes |
| **Railway** | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $5-20/mes |
| **Vercel** | ✅ | ❌ | Externa | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free-$20/mes |
| **CF Pages** | ❌ | ❌ | Externa | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Free-$5/mes |
| **CF Workers** | ⚠️ | ✅ | D1 | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐ | $5/mes |
| **Fly.io** | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Free-$15/mes |

---

## Recomendación

### Si querés minimal risk:
**Quedarse en Render.com** — Ya funciona, no hay riesgo de romper nada.

### Si querés mejor performance:
**Migrar a Railway** — Más rápido, PostgreSQL incluido, WebSockets nativos. Migración relativamente simple (cambiar DATABASE_URL y redeploy).

### Si querés el mejor deploy experience:
**Migrar a Vercel** — Pero requiere reescribir Socket.IO (usar Pusher, Ably, o soketi) y mover la lógica server-side a API routes serverless.

### Si querés Cloudflare:
**Cloudflare Workers** — Solo si estás dispuesto a reescribir el backend (Prisma → Drizzle, PostgreSQL → D1, Node.js → V8 isolates). Mucho trabajo.

---

## Migración a Railway (paso a paso)

Si se elige Railway:

1. Crear cuenta en railway.app
2. Conectar repo de GitHub
3. Railway detecta `package.json` y crea el servicio
4. Agregar PostgreSQL addon (crea `DATABASE_URL` automáticamente)
5. Configurar variable `NODE_OPTIONS=--max-old-space-size=1024`
6. Configurar variable `PORT=3000`
7. Migrar DB: `pnpm prisma db push` o `pnpm prisma migrate deploy`
8. Verificar que Socket.IO funciona (Railway soporta WebSockets nativo)
9. Configurar dominio personalizado (opcional)
10. Eliminar servicio de Render

**Tiempo estimado**: 30-60 minutos
**Riesgo**: Bajo (cambiar DB_URL es casi transparente con Prisma)

---

*Documento generado: Junio 2026*
