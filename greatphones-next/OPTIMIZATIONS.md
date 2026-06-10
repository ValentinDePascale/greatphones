# Great Phones — Optimizaciones Pendientes (Vercel Best Practices)

## Completadas

- [x] **async-parallel** — `checkout/route.ts` — Stock validation: N queries `findUnique` → 1 `findMany` + Map
- [x] **async-parallel** — `admin/dashboard/route.ts` — `yearOrders`/`yearUsers` en `Promise.all`
- [x] **async-parallel** — `admin/dashboard/route.ts` — `recentOrders`/`topProducts`/`lowStock` en `Promise.all`
- [x] **async-parallel** — `conversations/[id]/messages/route.ts` — `conversation`/`senderUser` en `Promise.all`
- [x] **async-parallel** — `webhooks/mercadopago/route.ts` — Stock updates en `Promise.all`
- [x] **bundle-conditional** — Eliminados paquetes muertos (`@sendgrid/mail`, `resend`)
- [x] **bundle-barrel-imports** — Eliminado `src/lib/cors.ts` (nunca importado)
- [x] Limpieza de directorios vacíos (`cuenta/`, `register/`, `shop/`)
- [x] **server-hoist-static-io** — `page.tsx` — HTML cacheado a nivel de módulo (1 sola lectura)
- [x] **server-cache-lru** — Cache LRU para `GET /api/products` y `GET /api/accessories` (30s TTL)
- [x] **server-cache-lru** — Invalidación automática en POST/PUT/DELETE
- [x] **server-hoist-static-io** — `[...path]/route.ts` — index.html cacheado + eliminado serving estático redundante
- [x] **server-no-shared-module-state** — Socket.IO movido a módulo tipado (`src/lib/socket.ts`)
- [x] **client-swr-dedup** — Fetch deduplication utility con cache en memoria + dedup de requests en vuelo (`public/lib/storage.js`)
- [x] **client-swr-dedup** — `cachedFetch()` integrado en `render.js` para productos, cotizaciones, pedidos (60s/15s TTL)
- [x] **client-localstorage-schema** — Versioned localStorage wrapper con migración automática (`Storage.get/set/remove`)
- [x] **client-localstorage-schema** — Migración de keys `gp_*` a `gp_v1_*` en `navigation.js`, `cart.js`, `favorites.js`, `cookies.js`
- [x] **rerender-no-inline-components** — Componentes de payment extraídos a archivos separados (`SuccessContent.tsx`, `PendingContent.tsx`, `FailureContent.tsx`)
- [x] **rendering-resource-hints** — `next/font` agregado para Playfair Display y DM Sans con `display: 'swap'` (`layout.tsx`)
- [x] **rendering-resource-hints** — Metadata global agregado (title, description, viewport) (`layout.tsx`)
- [x] **rendering-script-defer-async** — Todos los scripts externos con `defer` para descarga paralela (`public/index.html`)
- [x] **rendering-script-defer-async** — Código de inicialización movido a `DOMContentLoaded` para ejecución después de scripts diferidos
- [x] **js-cache-storage** — Cache en memoria agregado al wrapper `Storage` para evitar lecturas repetidas de localStorage (`public/lib/storage.js`)
- [x] **js-index-maps** — Dashboard stats refactorizado con Map indexado por mes para lookups O(1) en lugar de iteraciones O(n) (`src/app/api/admin/dashboard/route.ts`)
- [x] **Root layout** — Completado con `next/font`, metadata global, estructura HTML (`layout.tsx`)
- [x] **Nodemailer** — `verify-email/route.ts` unificado con `sendEmail()` de `src/lib/email.ts`
- [x] **style jsx** — Migrado a `<style>` regular en `SuccessContent.tsx`
- [x] **Tests** — Corregidos errores de tipo en `checkout/route.test.ts` y `forgot-password/route.test.ts`
- [x] **@types/pg** — Instalado `@types/pg` para resolver errores de TypeScript en `prisma.ts`
- [x] **CORS** — Helper compartido creado (`src/lib/cors.ts`) con `getCorsHeaders()` y `corsOptions()`
- [x] **CORS** — Routes `products` y `accessories` actualizados para usar el helper compartido

---

## Pendientes por Prioridad

### 1. ELIMINATING WATERFALLS (CRITICO)

#### `async-suspense-boundaries` — Streaming con Suspense
- La home page (`page.tsx`) lee `public/index.html` con `readFileSync` y lo inyecta con `dangerouslySetInnerHTML`
- No hay streaming de contenido. Todo se renderiza de una vez
- **Fix:** Migrar la home a componentes React reales con `<Suspense>` para que el contenido crítico (hero, nav) se sirva primero y el resto (productos, ofertas) se streamée después
- **Archivos:** `src/app/page.tsx`

#### `async-cheap-condition-before-await` — Verificar condiciones baratas antes de await
- `checkout/route.ts:63` — `findOrCreateUser` se ejecuta antes de validar stock. Si el stock es insuficiente, se creó un usuario innecesariamente
- **Fix:** Mover la validación de stock ANTES del `findOrCreateUser`
- **Archivo:** `src/app/api/checkout/route.ts`

---

### 2. BUNDLE SIZE (CRITICO)

#### `bundle-dynamic-imports` — Code splitting con `next/dynamic`
- `Header.tsx` es un client component (`useState`) pero nunca se importa en ningún layout/page (esta muerto o se usa solo en el HTML estatico)
- **Fix:** Usar `next/dynamic` para cargar Header solo cuando sea necesario
- **Archivos:** `src/components/Header.tsx`

#### `bundle-defer-third-party` — Cargar analytics/logging después de hydration
- `socket.io` se carga en el mismo proceso que Next.js
- **Fix:** Considerar cargar el socket server solo cuando sea necesario (lazy init)
- **Archivo:** `socket-server/index.js`

---

### 3. SERVER-SIDE PERFORMANCE (ALTO)

#### `server-cache-react` — `React.cache()` para deduplicación por request
- No se usa `React.cache()` ni `cache()` de Next.js en ningún lado
- **Fix:** Envolver queries de Prisma que se repiten en el mismo request con `cache()`
- **Archivos:** Todos los API routes con múltiples queries que comparten datos

---

### 4. RENDERING PERFORMANCE (MEDIO)

#### `rendering-hydration-no-flicker` — Eliminar dangerouslySetInnerHTML (opcional)
- `page.tsx` usa `dangerouslySetInnerHTML` con HTML cacheado del filesystem
- Ya optimizado: HTML cacheado a nivel de módulo, `suppressHydrationWarning` presente
- **Fix avanzado:** Migrar a componentes React reales (requiere refactor completo del frontend)
- **Archivo:** `src/app/page.tsx`

---

### 5. JAVASCRIPT PERFORMANCE (BAJO-MEDIO)

---

### 6. PROBLEMAS ADICIONALES

#### ~~Root layout incompleto~~ ✅ COMPLETADO
- Agregado `next/font` para Playfair Display y DM Sans
- Metadata global (title, description, viewport)
- Estructura HTML completa con `<html lang="es">` y `<body>`

#### ~~CORS duplicado~~ ✅ COMPLETADO (parcial)
- Helper compartido creado en `src/lib/cors.ts`
- Routes `products` y `accessories` actualizados
- **Pendiente:** Actualizar los otros ~13 routes para usar el helper

#### ~~Nodemailer transporter duplicado~~ ✅ COMPLETADO
- `verify-email/route.ts` ahora usa `sendEmail()` de `src/lib/email.ts`

#### Rate limit no distribuido ⏭️ OMITIDO
- Requiere infraestructura Redis
- No crítico para el estado actual del proyecto

#### ~~Sin convenciones App Router~~ ⏭️ NO APLICA
- La app es una SPA servida desde `public/index.html`
- No hay rutas Next.js para shop, admin, cuenta (son rutas del SPA)

#### ~~`<style jsx>` en Next.js 16~~ ✅ COMPLETADO
- Migrado a `<style>` regular en `SuccessContent.tsx`

#### ~~Tests con errores de tipo~~ ✅ COMPLETADO
- Corregidos mocks en `checkout/route.test.ts` y `forgot-password/route.test.ts`

#### ~~Falta `@types/pg`~~ ✅ COMPLETADO
- Instalado `@types/pg` como devDependency

---

## NUEVAS FUNCIONALIDADES

### Ventas Presenciales (In-Store Sales) — ✅ IMPLEMENTADO

**Fecha:** Mayo 2026

**Descripción:** Sistema completo para registrar ventas presenciales en el panel de administración, con soporte para productos del catálogo + productos custom, pagos en efectivo (con cálculo de cambio) y transferencia/QR (MercadoPago).

**Características implementadas:**

1. **Base de datos:**
   - Campos agregados a `Order`: `cashReceived`, `change`, `saleChannel`, `adminId`
   - `OrderItem.productId` ahora es opcional para soportar productos custom
   - Campos `customName` y `customPrice` agregados a `OrderItem`
   - Relación `adminSales` agregada a `User` para tracking de ventas por admin

2. **API Endpoints:**
   - `POST /api/admin/instore-sale` — Crear venta presencial (efectivo o transferencia)
   - `GET /api/admin/instore-sale` — Historial de ventas presenciales con filtros
   - `POST /api/admin/instore-sale/verify-payment` — Verificar estado de pago QR
   - Webhook actualizado para buscar órdenes por `external_reference` (order code)

3. **Frontend:**
   - Nuevo botón "Venta en Tienda" en sidebar del admin
   - UI completa para crear ventas: datos del cliente, búsqueda de productos, productos custom
   - Selección de método de pago (efectivo/transferencia)
   - Cálculo automático de cambio para pagos en efectivo
   - Generación de QR para transferencias con polling de verificación (cada 3s, timeout 10min)
   - Historial de ventas presenciales con filtros por fecha y método de pago
   - Cancelación de ventas pendientes de pago

4. **Lógica de negocio:**
   - Validación de stock en tiempo real
   - Transacciones atómicas para actualización de stock
   - Pagos en efectivo: orden creada como `DELIVERED`, stock decrementado inmediatamente
   - Transferencias: orden creada como `PENDING`, stock reservado hasta confirmación de pago
   - Productos custom: permitidos sin necesidad de estar en el catálogo
   - Usuario creado automáticamente por DNI (reutilizado si ya existe)

**Archivos creados:**
- `src/app/api/admin/instore-sale/route.ts`
- `src/app/api/admin/instore-sale/verify-payment/route.ts`
- `public/lib/instore.js`

**Archivos modificados:**
- `prisma/schema.prisma` — Nuevos campos y relaciones
- `src/app/api/webhooks/mercadopago/route.ts` — Búsqueda por external_reference
- `src/app/api/admin/dashboard/route.ts` — Fix para productId null
- `public/index.html` — Botón en sidebar + script tag
- `public/lib/admin.js` — Caso 'instore' en renderAdminContent

**Base de datos:** Migración aplicada con `prisma db push`

**Build:** ✅ Exitoso (TypeScript compilado sin errores)

---

### Bug Fixes — Mayo 2026

#### 1. Promociones — Layout roto ✅ CORREGIDO
**Problema:** Los productos en la sección de promociones aparecían apilados verticalmente en lugar de en grid.
**Causa:** Tag de cierre `</article>` no coincidía con el tag de apertura `<div>` en `renderPromoProducts()`.
**Fix:** Cambiado `</article>` a `</div>` en línea 2008 de `render.js`.

#### 2. Venta en Tienda — Tab no abría ✅ CORREGIDO
**Problema:** Al hacer clic en "Venta en Tienda" en el sidebar, el contenido no cambiaba.
**Causa:** La función `renderAdminContent()` no tenía un caso para el tab `'instore'`.
**Fix:** 
- Agregado `'instore'` al mapping de títulos en `adminTab()`
- Agregado `#adm-instore` al selector de reset de botones
- Agregado caso `else if(tab==='instore')` en `renderAdminContent()` que llama a `loadInStoreHistory()`

**Archivos modificados:**
- `public/lib/render.js` — Fix de tag HTML + integración de tab 'instore'
