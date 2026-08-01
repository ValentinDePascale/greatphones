# Great Phones — Tecnología premium. Precio justo.

E-commerce de celulares y accesorios reacondicionados. Next.js 16 + Prisma + PostgreSQL (Neon) + MercadoPago.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # editar con tus credenciales
pnpm prisma generate
pnpm dev                       # arranca Next.js + Socket.IO en puerto 3000
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Dev server con Turbopack + Socket.IO (single process) |
| `pnpm dev:next` | Solo Next.js, sin chat |
| `pnpm build` | Build de producción (prisma generate + next build) |
| `pnpm start` | Producción (NODE_ENV=production) |
| `pnpm test` | Unit tests (vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

## Arquitectura

```
src/
  app/
    api/          # REST API (68 rutas)
    page.tsx      # Home — sirve el SPA desde public/index.html
    layout.tsx    # Root layout (metadata, viewport, fonts)
    [...path]/    # Catch-all para rutas del SPA (shop, sell, etc.)
  lib/
    auth.ts       # NextAuth + Google OAuth
    auth-guard.ts # requireSession, requireAdmin, handleRouteError
    session.ts    # JWT cookie (gp-session)
    validations.ts# Zod schemas compartidos
    prisma.ts     # PrismaClient singleton
    cache.ts      # LRU cache con TTL
    rate-limit.ts # Rate limiting DB-backed
    stock.ts      # Operaciones atómicas de stock
    pricing.ts    # Precios y generación de códigos
    response.ts   # Helpers de respuesta HTTP
    logger.ts     # Structured logging (pino)
    email.ts      # Envío de emails (nodemailer)
    socket.ts     # Socket.IO helper para rutas API
    cors.ts       # CORS headers (usa config centralizado)
  config/
    index.ts      # Configuración centralizada (origins, TTLs, costos)
  types/           # Type augmentations
public/
  index.html      # SPA (single page application)
  lib/*.js        # Vanilla JS (frontend)
  styles/*.css    # CSS
server.js         # Custom server (Next.js + Socket.IO)
socket-handlers.js# Event handlers de Socket.IO compartidos
prisma/
  schema.prisma   # Modelos de datos
```

## Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Frontend**: Vanilla JS SPA servido desde `public/index.html`
- **Base de datos**: PostgreSQL vía Neon (Prisma ORM)
- **Pagos**: MercadoPago (checkout online + QR en tienda)
- **Auth**: JWT HTTP-only cookie + NextAuth Google OAuth
- **Tiempo real**: Socket.IO para chat
- **Email**: Nodemailer (SMTP)
- **Imágenes**: Cloudinary
- **Testing**: Vitest (unit) + Playwright (e2e)

## Variables de entorno

Ver `.env.example` para la lista completa. Las mínimas requeridas:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 64`
- `MP_ACCESS_TOKEN` — MercadoPago access token
- `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials

## Health check

```
GET /api/health → { status, version, uptime, database: { status, latencyMs } }
```

## Licencia

Privado.
