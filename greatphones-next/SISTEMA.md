# GreatPhones Next — Documentación del Sistema

> **Versión:** 0.1.0 · **Stack:** Next.js 16.2.1 + React 19 + Prisma 7 + PostgreSQL + Redis + Socket.IO  
> **Fecha:** 2026-08-28 · **Rama actual:** `dev` (merge `fix/admin-legacy-load`)

---

## 1. Qué es y qué hace

**GreatPhones** es un e-commerce + ERP físico para un local de celulares.

- **Tienda Online (cliente):** catálogo de `Product` (celulares) y `Accessory`, carrito, checkout con Mercado Pago (online/preventa), cotizaciones de canje, chat en vivo, seguimiento de pedidos, cupones/GiftCards, wallet.
- **Panel Admin (ERP local):** operaciones de mostrador que antes estaban en Google Sheets + `public/admin-shell.html`. Hoy son 100% React con persistencia real en Postgres y mueve stock, caja y auditoría.

Roles: `CLIENT` (default) y `ADMIN` (`User.role`). Auth via `next-auth` (Credentials + Google) + adapter Prisma + cookie custom `gp-session` para LAN/túneles. Guard central `src/lib/auth-guard.ts` (`requireAdmin`, `requireAuth`, `getAuthenticatedUser`).

---

## 2. Stack y comandos

| Capa            | Tech                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router (`src/app`), React 19, Tailwind 4                      |
| DB              | PostgreSQL (Neon) + Prisma 7 (`prisma/schema.prisma`) + `@prisma/adapter-pg` |
| Cache/Real-time | Redis `ioredis` + `socket.io` (`server.js:HOST 0.0.0.0`) + `bullmq`          |
| Auth            | `next-auth@4` + `bcryptjs` + `gp-session` HttpOnly                           |
| Pagos           | `mercadopago` + `qrcode` + `@ramiidv/arca-facturacion` (AFIP)                |
| Email/Cloud     | `nodemailer` + `cloudinary` + `exceljs` + `gsap`                             |
| DX              | `pnpm`, `eslint`, `prettier`, `vitest`, `playwright`, `husky`/`lint-staged`  |

```bash
pnpm dev              # node server.js (Next + Socket.IO, HMR)
pnpm build            # prisma generate && next build
pnpm start            # producción 0.0.0.0 con --max-old-space-size=2048
pnpm prisma generate  # regenerar cliente si cambia schema (obligatorio tras pull)
pnpm prisma db push   # sync schema sin migración
node scripts/seed-iphone-imgs.mjs # poblar PriceList.imageUrl/colors GSMArena
```

Variables clave (`.env`): `DATABASE_URL`, `NEXTAUTH_URL` (`http://localhost:3000` en dev, `https://greatphones.com.ar` en prod, `http://192.168.x.x:3000` para LAN), `NEXTAUTH_SECRET`, `REDIS_URL`, `CLOUDINARY_*`, `MP_*`, `ARCA_*`, `ALLOWED_ORIGINS_EXTRA`.

---

## 3. Arquitectura

```
greatphones/
├─ greatphones-next/
│  ├─ server.js              # Next + Socket.IO, HOST 0.0.0.0, allowedDevOrigins, socketOrigins (192.168/10. + localhost)
│  ├─ next.config.ts         # allowedDevOrigins, CSP, headers
│  ├─ proxy.ts / middleware  # CSRF (isAllowedRequestOrigin) + CSP/HSTS + matcher /((?!_next|api)...)
│  ├─ src/app/
│  │  ├─ (storefront) home, producto/[slug], carrito, checkout, cuenta, chat
│  │  ├─ admin/              # Panel ERP (ver §4)
│  │  └─ api/                # REST (ver §7)
│  ├─ src/components/        # AdminTopbar (blanco, sticky, Ver tienda), AdminSidebar, AdminWizardShell, AdminModal, tokens
│  ├─ src/lib/               # prisma, auth, session, auth-guard, accounting, audit, request-guard, cache, audit
│  ├─ src/hooks/             # useAdminFetch, useCrud, useWizard
│  ├─ prisma/schema.prisma   # 30+ modelos (ver §5)
│  ├─ public/                # admin-shell.html + legacy js (render.js, admin.js, scanner.js)
│  └─ scripts/               # seed-iphone-imgs.mjs, etc.
└─ SISTEMA.md (este archivo)
```

**Request lifecycle:** `middleware.ts` (CSRF + Origin) → `request-guard.ts` (`isAllowedRequestOrigin` + `DEV_TUNNEL_PATTERNS` para `192.168/10./localhost` en dev) → `requireAdmin` (intenta `getServerSession` → fallback `gp-session` via `getSessionFromCookies`) → `registerEntry`/`updateCashBalance` + `auditar`/`anular` → `handleRouteError`.

**Cookies:** `gp-session=<base64url(payload).sig>; HttpOnly; [Secure en prod]; SameSite=Lax; Path=/`. `Secure` es condicional (`NODE_ENV===production || NEXTAUTH_URL https`) para permitir `http` LAN. NextAuth `useSecureCookies` deriva de `NEXTAUTH_URL`.

**Tiempo real:** `server.js` crea `io` con `socketOrigins` = `ALLOWED_ORIGINS` + `192.168.*` + `10.*`; `public/lib/socket.js` usa `window.location.origin`.

---

## 4. Panel Admin — Módulos

Todos con `AdminTopbar` blanco sticky (`background: var(--admin-surface,#fff)`) + `AdminSidebar` (240px, búsqueda, grupos por color).

| Grupo           | Ruta                                   | UI                                                                                                                                                                                             | DB                                                                                       | Qué hace                                                                                    |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Operaciones** | `/admin/ops/compras`                   | `ComprasClient` wizard 6 pasos (Operación→Equipo→Precio→Reparación→Preventa→Confirmar) + validación inline, `aria`, `preventScroll`                                                            | `InventoryItem` + `PreOrder` + `AccountingEntry(EGRESO)` + `AuditLog`                    | Crea `InventoryItem` (status `IN_STOCK`/`IN_REPAIR`), vincula `PreOrder`, asientos `COMPRA` |
|                 | `/admin/ops/ventas`                    | `VentasClient` wizard 5 pasos + agrupado por stock real (`Product.stock-reserved`), selector accesorios con stock, cuadre cobro/operación                                                      | `Product` (stock/reserved) + `Accessory` + `AccountingEntry(INGRESO)` por medio          | GET `Product` `isPreorder=false stock>0`; POST descuenta `Product+Accessory` en transacción |
|                 | `/admin/ops/preventas`                 | `PreventasClient` wizard 5 pasos + select iPhone (`/api/products?search=iPhone`) / custom                                                                                                      | `PreOrder(source:local)` + `AccountingEntry(PREVENTA)`                                   | Reserva sin stock, cobro anticipado (USD → `amountUsd`)                                     |
|                 | `/admin/ops/entregar-preventa`         | `EntregaClient` wizard 3 pasos + ficha saldo + “Completar con efectivo”                                                                                                                        | `PreOrder` → `DELIVERED` + opcional `InventoryItem SOLD` + `AccountingEntry`             | Cobra saldo, cierra preventa                                                                |
| **Precios**     | `/admin/precios`                       | `ListaPreciosClient` tabs Ver/Editar + `PreciosVista` (cards/tabla/compacta, buscador, filtros por familia, `dolarVenta` live) + `PrecioEditor` modal (focus trap, `Esc`, `imageUrl`/`colors`) | `PriceList(category:CELULAR)`                                                            | CRUD lista, copia precios/WA, conversión USD `precioARS/dolarVenta`                         |
|                 | `/admin/precios/mac-ipad`              | idem                                                                                                                                                                                           | `PriceList(category:MACIPAD)`                                                            | idem                                                                                        |
|                 | `/admin/precios/toma`                  | `TomaVista`/`TomaEditor` + chips colores                                                                                                                                                       | `PriceTradeIn`                                                                           | Toma de equipos: `impecable - fallas`                                                       |
|                 | `/admin/precios/calculadora-toma`      | `CalcTomaClient` chips fallas, 2 secciones                                                                                                                                                     | `PriceTradeIn`+`PriceList` (lectura)                                                     | `valorToma = impecable - descuentos`, `diferencia = precioCanje - valorToma`                |
|                 | `/admin/precios/calculadora-cuotas`    | `CalcCuotasClient` form + resultados                                                                                                                                                           | `CuotasConfig`                                                                           | `total*coeficiente` por cuota                                                               |
|                 | `/admin/precios/cuotas`                | `CuotasEditor` tabla + modal                                                                                                                                                                   | `CuotasConfig`                                                                           | CRUD cuotas (`cuotas, coeficiente, activo, mostrar, observacion, orden`)                    |
|                 | `scripts/seed-iphone-imgs.mjs`         | —                                                                                                                                                                                              | `PriceList.imageUrl` (GSMArena `fdn2.../apple-iphone-*`) + `colors`                      | Pobla 32 modelos (53 filas)                                                                 |
| **Taller**      | `/admin/taller/reparaciones`           | `ReparacionClient` wizard 6 pasos + presupuesto auto (`/api/admin/taller` → `RepairConfig*PriceTradeIn`)                                                                                       | `Repair` + `AccountingEntry`                                                             | `REP-xxx`, jobs, diagnóstico, `DELIVERED`/`thirdParty`                                      |
|                 | `/admin/taller/reparaciones/historial` | `HistorialClient` filtro status, botones Entregado/A tercero                                                                                                                                   | `Repair`                                                                                 | `PATCH status=DELIVERED`                                                                    |
|                 | `/admin/taller/tarifario`              | `TarifarioClient` tabs ver/config + modal `RepairConfig`                                                                                                                                       | `PriceTradeIn`+`RepairConfig`                                                            | `precio = descuentoToma*multiplicador`                                                      |
|                 | `/admin/taller/gastos`                 | `GastoClient` wizard 4 pasos                                                                                                                                                                   | `AccountingEntry(source:GASTO)`                                                          | `GST-xxx` con `EFECTIVO/TRANSFERENCIA/USD`                                                  |
| **Análisis**    | `/admin/analisis/calendario`           | `CalendarioClient` KPIs + ranking + detalle día                                                                                                                                                | `Repair/PreOrder/Order/Quote/Arrepentimiento`                                            | Agrupa por `iso` día, hrefs → `entregar-preventa` / `taller/reparaciones`                   |
|                 | `/admin/analisis/reportes`             | `ReportesClient` filtros `desde/hasta`, balances por medio, `canales` online/local, libro diario                                                                                               | `CashRegister` + `AccountingEntry` + `Order` (excluye anuladas vía `AuditLog ANULACION`) | Ingresos/egresos consolidados                                                               |
|                 | `/admin/dashboard` (legacy)            | `public/lib/render.js` `loadDashboard`                                                                                                                                                         | `Order/User/Product/Accessory`                                                           | KPI mensual, top, lowStock — cache 60s                                                      |
| **Gestión**     | `/admin/gestion/mis-operaciones`       | `MisOperacionesClient` filtros operador/tipo/fecha, modal detalle                                                                                                                              | `AccountingEntry`                                                                        | Libro diario con anulación                                                                  |
|                 | `/admin/gestion/comisiones`            | `ComisionesClient` filtros fecha                                                                                                                                                               | agregado `Product/Order`                                                                 | Indicadores por operador                                                                    |
|                 | `/admin/auditoria`                     | `AuditClient` búsqueda + paginación + modal Anular                                                                                                                                             | `AuditLog`                                                                               | `POST /api/admin/audit` → `anular()` + reverse accounting                                   |
|                 | `/admin/contabilidad`                  | `AccountingClient`                                                                                                                                                                             | `AccountingEntry` + `CashRegister`                                                       | Caja por medio (excluye anuladas)                                                           |
|                 | `/admin/inversores`                    | `InvestorsClient` cards KPI + modal                                                                                                                                                            | `Investor` + `InvestorMovement`                                                          | Cuenta corriente `capital/paidTotal/pending`                                                |
|                 | `Cotizaciones`                         | `QuotesDashboardClient` + `AdminTopbar` sticky                                                                                                                                                 | `Quote` (+ `InventoryItem/PurchasedDevice` para stock real)                              | Embudo, topDevices, ticket promedio                                                         |
|                 | `Inventario`                           | `productos/accesorios/stock` (legacy `serveAdminSpa`)                                                                                                                                          | `Product/Accessory/InventoryItem`                                                        | Stock real (filtra `isPreorder` en `/api/products` y `InventoryItem` sin `SOLD`)            |
|                 | `Comercio online`                      | `ventas/preventa/pedidos/cupones/arrep` (legacy)                                                                                                                                               | `Order/PreOrder/Coupon/Arrepentimiento`                                                  | Historial web                                                                               |
|                 | `Comunicación`                         | `chat/users`                                                                                                                                                                                   | `Conversation/Message`                                                                   | Chat realtime via Socket.IO                                                                 |

> **Nota stock:** `Ventas` decrementa `Product.stock` + `Accessory.stock` en transacción; `admin/stock` (legacy `public/pages/admin.html`) filtra `isPreorder=false`; `Preventa Online` es `Product.isPreorder=true` con `stock = "Preventa"` (no 0). Accesorios también se descuentan en `ventas`.

---

## 5. Modelos Prisma clave

- `User` (role CLIENT/ADMIN) + `Account/Session/Wallet/Cart/Favorite`
- `Product` (`price/cost/stock/reserved/sold, isPreorder, isOffer, deletedAt, imageUrl, storage, color, battery`)
- `InventoryItem` (IMEI único, `code CMP-`, `modelName/brand/storage/color, purchasePrice/targetPrice, status IN_STOCK/SOLD/IN_REPAIR`, `productId?`)
- `PreOrder` (`code PRE-`, `clientName, price, status PENDING/PAID/COMPRADO/DELIVERED, source local/online, expectedDeliveryStart/End, deletedAt`)
- `Repair` (`code REP-`, `device/issue, fault1/2, jobs[], isDiagnosis, priceCalc/pricePaid, status PENDING/DELIVERED, thirdParty, deliveredAt`)
- `Quote` (`code QT-`, `device/storage/condition, basePrice/finalPrice, status PENDING→COMPLETED, deletedAt`) → `PurchasedDevice` al aceptar
- `Order`/`OrderItem` (`code, status PENDING→DELIVERED, saleChannel online/instore/preorder, total, mp*`, `deletedAt`)
- `Accessory` (`stock/reserved/isActive, price/cost`)
- **Precios:** `PriceList(category CELULAR/MACIPAD, modelo/almacenamiento, precioARS/preventaARS/descuentoARS, imageUrl, colors[], orden)`, `PriceTradeIn(modelo, impecable, bateria...pin)`, `CuotasConfig(cuotas/coeficiente/activo/mostrar)`
- **ERP:** `AccountingEntry(source, operationId VTA-/CMP-/PRE-/GST-, type INGRESO/EGRESO, means EFECTIVO/TRANSFERENCIA/CUOTAS/USD/PAGO_ONLINE, amount, amountUsd, opDate)`, `CashRegister(means, balance, balanceUsd)`, `AuditLog(entityType, entityId, action ANULACION/CREACION, snapshot)`, `Investor(name, capital, pending)`, `RepairConfig(key→multiplicador/horas)`, `AppConfig`

Índices en `means/type/source/opDate`, `entityType/entityId`, `category/modelo`.

---

## 6. APIs principales (requieren `requireAdmin` salvo tienda)

- `GET/POST/PATCH/DELETE /api/admin/precios` (CELULAR) y `/macipad`, `toma`, `cuotas`, `GET /dolar?tipo=blue` (dolarapi, cache 10m)
- `GET /api/admin/taller` (tarifario), `POST /api/admin/taller` (presupuesto), `GET/PATCH/POST /api/admin/taller/reparaciones` (+ `GET` historial, `PATCH thirdParty`), `POST /api/admin/taller/gastos` (`GST-`), `GET/POST /api/admin/taller/config`
- `POST /api/admin/ops/compras` (CMP-), `GET/POST /api/admin/ops/ventas` (VTA- con `productId`), `POST /api/admin/ops/preventas` (PRE-), `GET/POST /api/admin/ops/entregar-preventa` (PRE-ENTREGA-)
- `GET /api/admin/analisis/reportes?desde&hasta` (balances excluyen anuladas vía `AuditLog`), `GET /api/admin/calendario?mes=YYYY-MM` (pendientes por día, hrefs a `entregar-preventa`/`taller/reparaciones`), `GET /api/admin/dashboard` (12 meses, lowStock)
- `GET /api/admin/gestion/mis-operaciones?limit&operador&source`, `GET /api/admin/audit?entityType&search&page`, `POST /api/admin/audit` (anulaciones con reverse contable), `GET /api/accounting` (listEntries)
- Tienda: `GET /api/products?brand&search&preorder&limit`, `POST /api/products` (si `isPreorder` sin `imageUrl` copia `PriceList.imageUrl` por `modelo+storage`), `POST /api/checkout` (crea `Order` + `OrderItem`, descuenta `Product` si no preorder), `GET /api/auth/*` (next-auth + `gp-session`)

---

## 7. Flujos de negocio

- **Compra:** `ComprasClient` → `InventoryItem IN_STOCK` (+ `PreOrder → COMPRADO` si vinculada) → `AccountingEntry EGRESO` + `AuditLog CREACION` + `CashRegister -=` . Eliminar revierte `InventoryItem` + stock + asiento reverso.
- **Venta:** valida `stock-reserved≥1` → `$transaction(Product.stock--, Accessory.stock--)` → `AccountingEntry INGRESO` prorrateado por medio (USD como `amountUsd`) → `AuditLog VENTA`. Accesorios del catálogo con stock real.
- **Preventa (local):** `PreOrder PENDING` + `AccountingEntry INGRESO` por medio (USD incluido). Producto `isPreorder=true` no descuenta stock hasta checkout.
- **Entregar Preventa:** cobra saldo (`efectivo/transferencia/cuotas/usd`) → opcional `InventoryItem SOLD` → `PreOrder DELIVERED`.
- **Reparación:** calcula `precioCalc` desde `PriceTradeIn*RepairConfig`; `Diagnóstico` queda `DIAGNOSIS` precio 0; al cobrar crea `Repair` + `AccountingEntry`. Historial permite `DELIVERED` + `thirdParty`.
- **Preventa Online (tienda):** `Product.isPreorder=true`, `stock` es texto `"Preventa"` (no 0), no aparece en `admin/stock` (`isPreorder=false`).
- **Anulaciones:** `POST /api/admin/audit` con `entityType/entityId/reason` → `anular()` marca `deletedAt` + `AuditLog ANULACION` + reverse `AccountingEntry` + reversión de `CashRegister` (balances recalculados excluyendo anuladas) + revert `stock` si era compra/venta.

---

## 8. Frontend

- **Tienda:** `src/app/home/page.tsx` (SSR), `src/app/producto/[slug]`, `src/app/checkout`, `src/app/cuenta`, `src/components/*`, `public/partials/header.html` (`.catnav-inner` left-aligned `flex-start`, mismo `var(--W)` que `.nav`), `gsap` para motion.
- **Admin moderno (React):** `src/app/admin/ops/compras|ventas|preventas|entregar-preventa`, `precios/*`, `taller/*`, `analisis/reportes|calendario`, `gestion/*`, `auditoria`, `cotizaciones` — todos con `AdminTopbar` (`background: var(--admin-surface,#fff)`, sticky) + `AdminSidebar` (search, grupos coloreados) + `AdminWizardShell/Modal/TabContainer/tokens` + hooks `useAdminFetch/useCrud/useWizard`.
- **Admin legacy (SPA):** `src/app/admin/productos|accesorios|stock|promos|ventas|preventa|pedidos|cotizaciones|chat|usuarios` usan `serveAdminSpa('tab')` + `AdminPageClient` que carga `public/admin-shell.html` y `public/lib/*.js` (`render.js:loadDashboard`, `admin.js:_renderAdminLegacy`) con polling 150ms x60 y dedup `__gpLoadedScripts`. `dev` ya porta fix `loadLegacyScripts` y `spa-pages.ts` excluye `admin-login.html`.
- **Estilos:** `public/styles/components.css` (`.catnav-inner {justify-content:flex-start}`), `admin.css` (`--admin-surface`), `tokens.ts` (naranja `#FF6B2C`).

---

## 9. Cómo correr y probar

```bash
# DB y cliente
pnpm prisma generate          # tras cada pull con cambios en schema
pnpm prisma db push           # sync si no hay migración
node scripts/seed-iphone-imgs.mjs # 53 filas PriceList con GSMArena img/colors

# Dev local
NEXTAUTH_URL=http://localhost:3000 pnpm dev        # http://localhost:3000/home y /admin
# LAN celular
$env:NEXTAUTH_URL="http://192.168.18.12:3000"; pnpm dev # + allowedDevOrigins incluye 192.168/10./localhost
# Túnel https (evita Secure/CORS)
cloudflared tunnel --url http://localhost:3000 # o npx localtunnel --port 3000
# NEXTAUTH_URL=https://xxx.trycloudflare.com (+ALLOWED_ORIGINS_EXTRA)

# Verificación rápida
curl http://localhost:3000/api/admin/precios -H "Cookie: gp-session=..."
pnpm test && pnpm lint && pnpm typecheck
```

Problemas comunes: `Cannot find module '.prisma/client/default'` → `pnpm prisma generate`; `Origen no permitido` → revisa `src/config/index.ts` `ALLOWED_ORIGINS`/`DEV_TUNNEL_PATTERNS` y `NEXTAUTH_URL`; sesión cae en LAN → `Secure` ya es condicional (`production`/`https`).

---

## 10. Estado reciente y pendientes

- **Hecho en `dev`/`fix/admin-legacy-load`:** wizards 6/5 pasos con `preventScroll` + `aria`, `PrecioEditor` modal trap, `CuotasEditor` CRUD, `Venta` con stock real y accesorios, `Inventario` sin `isPreorder`, `Cotizaciones Dashboard` con `AdminTopbar`, `Calendario` hrefs a `entregar-preventa`/`taller/reparaciones`, `Historial Reparaciones` con `thirdParty`, `Reportes/Caja` excluyen anuladas, `Secure` condicional para LAN, catnav left-align, colores por variante (53 filas, fallback `COLORES_POR_VARIANTE`).
- **Pendientes del último listado:** `admin/stock` ya filtra `PREORDER`, `preventa` duplicado `iPhone iPhone` fixeado en `PreOrder.productModelName`, `Gasto` horario ahora usa `opDate` local (no UTC 12pm), `Configurar Cuotas` con ayuda contextual, `Producto Preventa Online` con `stock="Preventa"` y no `0`, `Eliminar preventa/compra` revierte `PreOrder/InventoryItem` + stock + asiento.
- **Deploy:** ` greatphones-next/next.config.ts` ya permite `fdn2.gsmarena.com` para imágenes externas.

> Documento generado automáticamente el 2026-08-28 a partir de `package.json`, `prisma/schema.prisma`, `src/app/**` y ramas `dev`/`redesign`/`fix/admin-legacy-load`. Para actualizar, re-ejecutar `node scripts/seed-iphone-imgs.mjs` y `pnpm prisma generate`.
