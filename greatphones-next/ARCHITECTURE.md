# Arquitectura del Sistema - Great Phones

Plataforma e-commerce para reventa de iPhones y productos Apple en Bahía Blanca, Argentina.

---

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Base de Datos](#base-de-datos)
4. [API REST](#api-rest)
5. [Tiempo Real (Socket.IO)](#tiempo-real-socketio)
6. [Autenticación](#autenticación)
7. [Pagos (MercadoPago)](#pagos-mercadopago)
8. [Notificaciones por Email](#notificaciones-por-email)
9. [Chat en Vivo](#chat-en-vivo)
10. [Panel de Administración](#panel-de-administración)
11. [Infraestructura y Deployment](#infraestructura-y-deployment)
12. [Seguridad](#seguridad)
13. [Testing](#testing)
14. [Variables de Entorno](#variables-de-entorno)

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Descripción |
|------|-----------|---------|-------------|
| Frontend | Next.js (App Router) | 16.2.1 | Framework de React para aplicaciones full-stack. Maneja routing, SSR, y optimizaciones automáticas |
| UI Framework | React | 19.2.4 | Biblioteca de JavaScript para construir interfaces de usuario con componentes reutilizables |
| Estilos | Tailwind CSS | 4.x | Framework CSS utility-first que permite diseñar interfaces directamente en el HTML con clases predefinidas |
| Lenguaje | TypeScript | 5.x | Superconjunto de JavaScript que agrega tipado estático para detectar errores en tiempo de compilación |
| Base de Datos | PostgreSQL (Neon) | - | Sistema de base de datos relacional open-source. Neon es una versión managed (alojada) en la nube |
| ORM | Prisma | 7.6.0 | Object-Relational Mapper para Node.js. Permite interactuar con la DB usando objetos TypeScript en vez de SQL raw |
| Tiempo Real | Socket.IO | 4.8.3 | Biblioteca de JavaScript que permite comunicación bidireccional en tiempo real entre cliente y servidor via WebSockets |
| Pagos | MercadoPago SDK | 2.12.0 | SDK oficial de MercadoPago para integrar pagos online (tarjetas, transferencia, etc.) en Argentina |
| Email (primario) | SendGrid | 8.1.6 | Servicio de entrega de email transaccional (confirmaciones, notificaciones) con alta deliverability |
| Email (secundario) | Resend | 6.12.0 | Alternativa a SendGrid para envío de emails, usado como backup/fallback |
| Almacenamiento | Cloudinary | 2.9.0 | Servicio de CDN para almacenar, optimizar y servir imágenes y archivos multimedia |
| Validación | Zod | 4.3.6 | Biblioteca de validación de esquemas para TypeScript/JavaScript. Valida datos de entrada de API |
| Package Manager | pnpm | 11.5.0 | Gestor de paquetes alternativo a npm, más rápido y eficiente en el uso de disco |
| Testing (unit) | Vitest | 4.1.6 | Framework de testing unitario rápido para Vite/TypeScript, compatible con Jest |
| Testing (E2E) | Playwright | 1.60.0 | Framework de testing end-to-end que automatiza navegadores reales para testear flujos completos |

---

## Estructura del Proyecto

```
greatphones-next/
├── server.js                    # Servidor HTTP custom con Socket.IO integrado
├── socket-server/               # Servidor Socket.IO standalone (dev mode)
├── public/                      # Frontend estático
│   ├── index.html               # SPA principal (todas las páginas)
│   ├── lib/                     # JavaScript vanilla
│   │   ├── navigation.js        # Router client-side
│   │   ├── render.js            # Renderizado de grids, dashboard, gráficos
│   │   ├── admin.js             # APIs admin, CRUD productos/pedidos
│   │   ├── chat.js              # Socket chat, auto-reply FAQ
│   │   ├── cart.js              # Carrito y checkout
│   │   ├── checkout.js          # Formulario de pago
│   │   ├── notifications.js     # Badge de notificaciones
│   │   ├── constants.js         # Constantes globales
│   │   └── utils.js             # Utilidades compartidas
│   └── assets/                  # Imágenes, iconos, fonts
├── src/
│   ├── app/
│   │   ├── page.tsx             # Homepage (p-home section)
│   │   ├── layout.tsx           # Layout raíz
│   │   └── api/                 # API routes (ver sección API)
│   ├── lib/
│   │   ├── prisma.ts            # Cliente Prisma + pg Pool
│   │   ├── email.ts             # SendGrid + Resend
│   │   ├── validations.ts       # Schemas Zod
│   │   ├── rate-limit.ts        # Rate limiter in-memory
│   │   └── cors.ts              # CORS config
│   └── middleware.ts            # Next.js middleware
├── prisma/
│   └── schema.prisma            # Schema de base de datos
├── e2e/                         # Tests E2E (Playwright)
├── scripts/                     # Scripts de utilidad
├── .github/workflows/           # CI/CD (GitHub Actions)
├── vitest.config.ts             # Config testing unitario
└── playwright.config.ts         # Config testing E2E
```

### Modelo SPA (Single Page Application)

El frontend es una SPA vanilla (sin componentes React) que utiliza:

- **`index.html`**: Contiene todas las secciones/páginas como divs ocultos (`p-home`, `p-shop`, `p-admin`, `p-checkout`, etc.)
- **`navigation.js`**: Router client-side que muestra/oculta secciones según la URL
- **`render.js`**: Renderiza grids de productos, dashboard admin, gráficos Chart.js
- **URL Map**: Mapeo de rutas a funciones de renderizado

---

## Base de Datos

### Proveedor

- **Hosting**: Neon (PostgreSQL managed) - Servicio de base de datos PostgreSQL en la nube con auto-scaling
- **Conexión**: Pool de conexiones con `pg` (max: 5 conexiones, idle timeout: 30s) - Reutiliza conexiones para mejorar rendimiento
- **ORM**: Prisma Client 7.6.0 - Capa de abstracción para interactuar con la DB sin SQL raw

### Modelos Principales

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuarios (CLIENT/ADMIN) - Almacena datos de perfil, rol y autenticación |
| `Product` | Productos (iPhones, etc.) - Catálogo con precio, stock, specs, imágenes |
| `Accessory` | Accesorios - Productos complementarios (fundas, cargadores, etc.) |
| `Order` | Pedidos con estados - Transacciones de compra con tracking y envío |
| `OrderItem` | Items dentro de un pedido - Relación N:N entre Order y Product |
| `Conversation` | Conversaciones de chat - Hilos de comunicación usuario-admin |
| `Message` | Mensajes del chat - Contenido de cada mensaje con estado (sent/delivered/read) |
| `Notification` | Notificaciones del sistema - Alertas de ofertas, pedidos, mensajes |
| `Quote` | Cotizaciones de dispositivos - Presupuestos para compra de usado |
| `Arrepentimiento` | Derecho de arrepentimiento (Ley 24.240) - Devoluciones según legislación argentina |
| `Supplier` | Proveedores - Fuentes de stock de productos |
| `Wallet` | Billetera de usuarios - Saldo y transacciones internas |
| `Favorite` | Productos favoritos - Lista de deseos del usuario |
| `Account` / `Session` | NextAuth (preparado) - Tablas para autenticación OAuth futura |

### Estados de Pedido (OrderStatus)

```
PENDING → PROCESSING → SHIPPED → DELIVERED
                           ↓
                      CANCELLED
```

### Estados de Arrepentimiento (ArrepEstado)

```
PENDIENTE → APROBADO → COMPLETADO
           → RECHAZADO (con motivo)
```

### Configuración de Pool (`src/lib/prisma.ts`)

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                    // Máximo 5 conexiones simultáneas
  idleTimeoutMillis: 30000,  // Cierra conexiones inactivas después de 30s
  connectionTimeoutMillis: 5000, // Timeout de conexión de 5s
});
```

---

## API REST

Todas las rutas están en `src/app/api/`. Las respuestas paginadas usan el formato:

```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

### Endpoints Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Listar productos (paginado, con búsqueda) |
| GET | `/api/products?search=iphone` | Búsqueda de productos |
| GET | `/api/accessories` | Listar accesorios (paginado, con búsqueda) |
| POST | `/api/checkout` | Crear preference MercadoPago |
| POST | `/api/arrepentimiento` | Solicitar arrepentimiento |
| POST | `/api/upload` | Subir imagen a Cloudinary |
| GET | `/api/quotes` | Listar cotizaciones |
| GET | `/api/shipping/andreani` | Calcular envío Andreani |

### Endpoints Autenticados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/orders` | Pedidos del usuario |
| GET | `/api/favorites` | Favoritos del usuario |
| POST | `/api/favorites` | Agregar/quitar favorito |
| GET | `/api/notifications` | Notificaciones del usuario |
| GET | `/api/notifications?countOnly=true` | Solo count (badge) |
| PATCH | `/api/notifications` | Marcar como leídas |
| GET | `/api/conversations` | Conversaciones del usuario |
| POST | `/api/conversations` | Crear conversación |
| GET | `/api/conversations/[id]/messages` | Mensajes de conversación |
| POST | `/api/conversations/[id]/messages` | Enviar mensaje |
| PATCH | `/api/conversations/[id]/read` | Marcar mensajes leídos |
| POST | `/api/conversations/[id]/close` | Cerrar conversación |

### Endpoints Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Estadísticas y métricas |
| GET | `/api/admin/products` | Listar productos (admin) |
| POST | `/api/admin/products` | Crear producto |
| PUT | `/api/admin/products` | Actualizar producto |
| DELETE | `/api/admin/products` | Eliminar producto |
| PATCH | `/api/admin/products/duplicate` | Duplicar producto |
| GET | `/api/admin/orders` | Listar pedidos (admin) |
| PATCH | `/api/admin/orders` | Actualizar pedido |
| PATCH | `/api/admin/orders/status` | Cambiar estado + tracking |
| GET | `/api/admin/accessories` | Listar accesorios (admin) |
| POST | `/api/admin/accessories` | Crear accesorio |
| PUT | `/api/admin/accessories` | Actualizar accesorio |
| DELETE | `/api/admin/accessories` | Eliminar accesorio |
| GET | `/api/admin/conversations` | Todas las conversaciones |
| DELETE | `/api/admin/conversations` | Eliminar conversación |
| PATCH | `/api/admin/arrepentimientos` | Aprobar/rechazar arrepentimiento |
| GET | `/api/admin/suppliers` | Listar proveedores |
| POST | `/api/admin/suppliers` | Crear proveedor |

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (bcryptjs + sesión) |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/forgot-password` | Enviar código reset |
| POST | `/api/auth/reset-password` | Resetear contraseña |
| GET | `/api/auth/[...nextauth]` | NextAuth (Google OAuth - preparado) |

---

## Tiempo Real (Socket.IO)

**Socket.IO** es una biblioteca de JavaScript que permite comunicación bidireccional en tiempo real entre el navegador y el servidor. Utiliza WebSockets como transporte principal, con fallback a polling HTTP si el navegador no soporta WebSockets.

### Configuración

- **Producción**: Socket.IO integrado en `server.js` (mismo proceso que Next.js) - Un solo proceso maneja HTTP + WebSocket
- **Desarrollo**: Servidor standalone en `socket-server/index.js` (puerto 3001) - Separa Next.js del socket para hot reload
- **CORS**: `localhost:3000` + `greatphones.onrender.com` - Permite conexiones desde ambos dominios

### Eventos Socket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `connection` | Server | Conexión de usuario - Se dispara cuando un cliente se conecta |
| `joinConversation` | Client→Server | Unirse a sala de conversación - El cliente se "suscribe" a una sala |
| `leaveConversation` | Client→Server | Salir de sala - El cliente deja de recibir mensajes de esa sala |
| `typing` | Client→Server | Usuario escribiendo - Notifica que el usuario está escribiendo |
| `stopTyping` | Client→Server | Dejó de escribir - Cancela la indicación de "escribiendo..." |
| `markRead` | Client→Server | Marcar mensajes leídos - Informa que el usuario vio los mensajes |
| `messageSent` | Client→Server | Mensaje enviado - Confirma que un mensaje fue enviado |
| `newMessage` | Server→Client | Nuevo mensaje recibido - Entrega el mensaje a los clientes en la sala |
| `userTyping` | Server→Client | Alguien escribiendo - Muestra indicador "escribiendo..." al otro usuario |
| `userStoppedTyping` | Server→Client | Alguien dejó de escribir - Oculta el indicador |
| `messagesRead` | Server→Client | Mensajes marcados leídos - Actualiza el estado de los mensajes |
| `userOnline` | Server→Client | Usuario en línea - Notifica que un usuario se conectó |
| `userOffline` | Server→Client | Usuario desconectado - Notifica que un usuario se desconectó |

### GlobalThis.IO

En producción, `globalThis.io` permite enviar eventos desde cualquier API route:

```typescript
// Ejemplo en POST /api/conversations/[id]/messages
globalThis.io?.to(conversationId).emit('newMessage', messageData);
```

---

## Autenticación

### Sistema Actual

- **Login**: bcryptjs para hash de contraseñas, sesiones en cookie - bcrypt hashea las contraseñas con salt para seguridad
- **Registro**: Con verificación de email (código OTP) - Envía código de 6 dígitos para confirmar email
- **Roles**: `CLIENT` y `ADMIN` - Control de acceso por rol
- **Middleware**: Protege rutas admin - Intercepta requests antes de llegar a la ruta

### NextAuth (Preparado)

- **Provider**: Google OAuth - Login con cuenta de Google
- **Adapter**: Prisma - Guarda sesiones de OAuth en la DB
- **Pendiente**: Configurar credenciales en Google Cloud Console

---

## Pagos (MercadoPago)

**MercadoPago** es la plataforma de pagos más usada en Argentina. Permite cobrar con tarjeta de crédito, débito, transferencia bancaria y otros métodos de pago locales.

### Flujo

1. Usuario completa checkout → `POST /api/checkout`
2. Backend crea preference con `mercadopago` SDK - Preference = carrito de compra en MP
3. Frontend redirige a URL de pago MercadoPago - Usuario paga en el sitio de MP
4. MercadoPago redirige a `/checkout/success` o `/checkout/failure`
5. Webhook recibe notificación de pago - MP notifica al backend del resultado

### Estados MP en Order

- `mpPreferenceId`: ID de preference - Identificador único de la transacción
- `mpPaymentId`: ID de pago - ID del pago procesado
- `mpStatus`: Estado del pago - approved, pending, rejected, etc.

---

## Notificaciones por Email

### Proveedores (Dual)

| Proveedor | Uso |
|-----------|-----|
| **SendGrid** | Emails principales (transaccionales) - Servicio enterprise de email transaccional |
| **Resend** | Backup / fallback - Alternativa moderna y simple para emails |

### Funciones (`src/lib/email.ts`)

| Función | Descripción |
|---------|-------------|
| `sendOrderConfirmationEmail()` | Confirmación de pedido - Email al cliente con resumen de compra |
| `sendAdminReplyEmail()` | Respuesta admin al usuario - Notifica respuesta del admin |
| `sendNewMessageToAdminEmail()` | Nuevo mensaje de usuario → admin - Alerta al admin de nuevo chat |
| `sendOrderStatusEmail()` | Cambio de estado del pedido - Notifica cambios (enviado, entregado, etc.) |

### Características

- Envío **non-blocking** (no bloquea la respuesta API) - Usa `Promise.allSettled` para no retrasar la respuesta
- Intento de SendGrid primero, fallback a Resend - Si falla uno, intenta con el otro

---

## Chat en Vivo

### Arquitectura

- **Conexión**: Socket.IO en tiempo real - Comunicación bidireccional instantánea
- **Persistencia**: PostgreSQL (Conversation + Message) - Los mensajes se guardan en la DB
- **Auto-reply**: Sistema FAQ para primera vez - Respuestas automáticas para consultas comunes
- **Deduplicación**: Prevención de mensajes duplicados - Evita enviar el mismo mensaje 2 veces

### Flujo Auto-Reply (Primera Conversación)

1. Usuario abre chat → muestra botones FAQ - Interfaz de opciones predefinidas
2. Opciones: Horarios, Garantía, Envíos, Pagos, Devoluciones - Temas más consultados
3. Si elige "Hablar con asesor" → crea conversación + notifica admin - Escalación a humano
4. Flag `isAutoReply: true` → no genera email al admin - Evita spam de emails

### Quick Replies (Admin)

- Respuestas predefinidas para agilizar atención - Mensajes guardados que se reutilizan
- Configurables desde el panel admin - El admin puede crear/editar sus respuestas

### Búsqueda de Conversaciones

- Admin puede buscar conversaciones por nombre/email de usuario - Filtrado en tiempo real
- Paginación de 100 conversaciones máximo - Evita cargas masivas

---

## Panel de Administración

### Estructura HTML

El admin panel usa la sección `p-admin` con `adminContent` div:

```html
<div id="p-admin">
  <div id="adminContent">
    <!-- Contenido dinámico renderizado por JS -->
  </div>
</div>
```

### Funciones Admin (`admin.js` + `render.js`)

| Función | Descripción |
|---------|-------------|
| `renderAdminContent()` | Renderiza contenido según hash - Router interno del admin |
| `loadDashboard()` | Métricas y gráficos - Carga datos del dashboard |
| `renderProductsList()` | Grid de productos con búsqueda/paginación - Lista de productos |
| `renderOrdersList()` | Lista de pedidos - Gestión de pedidos |
| `renderAccessoriesList()` | Lista de accesorios - Gestión de accesorios |
| `renderStockList()` | Inventario (20 items/página) - Vista de stock |
| `renderChatPanel()` | Panel de chat admin - Atención al cliente |
| `duplicateProduct()` | Clonar producto - Duplica un producto existente |

### Dashboard

- **Gráficos**: Chart.js (ventas, pedidos, marcas) - Librería de gráficos interactivos
- **Métricas**: Total ventas, pedidos pendientes, usuarios activos - KPIs del negocio
- **Optimizado**: Queries aggregate (~5 queries vs ~24 originales) - Reducción de 80% en consultas DB
- **Auto-refresh**: Cada 5 minutos - Actualización automática de datos

### Funcionalidades

- CRUD completo de productos y accesorios - Crear, leer, actualizar, eliminar
- Gestión de pedidos con estados y tracking - Seguimiento de envíos
- Chat con respuestas rápidas - Atención eficiente
- Eliminación de conversaciones - Limpieza de chats
- Búsqueda en tiempo real - Filtrado instantáneo

---

## Infraestructura y Deployment

### Plataforma

- **Hosting**: Render.com - Plataforma PaaS para desplegar apps web con CI/CD integrado
- **URL**: https://greatphones.onrender.com
- **Base de datos**: Neon (PostgreSQL managed) - DB serverless con auto-scaling

### Proceso de Producción

```bash
# Comando de inicio
NODE_OPTIONS="--max-old-space-size=1024" node server.js
```

- **RAM**: Límite de 1GB - Previene consumo excesivo de memoria
- **Puerto**: 3000 (configurable via `PORT`)
- **Socket.IO**: Integrado en mismo proceso - Un solo servidor maneja HTTP + WebSocket

### CI/CD (GitHub Actions)

- **Triggers**: Push a main - Se ejecuta automáticamente al hacer push
- **Steps**: Install pnpm → Install deps → Lint → Build → Deploy - Pipeline completo
- **Node.js**: 20.x - Versión LTS estable

### Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Desarrollo (Next + Socket standalone) - Corre ambos servidores separados |
| `pnpm build` | Build de producción - Compila TypeScript y optimiza para producción |
| `pnpm start` | Producción (server.js) - Inicia servidor HTTP con Socket.IO |
| `pnpm lint` | ESLint - Verifica estilo de código |
| `pnpm test` | Vitest (unit tests) - Ejecuta tests unitarios |
| `pnpm test:e2e` | Playwright (E2E tests) - Ejecuta tests de extremo a extremo |

---

## Seguridad

### Medidas Implementadas

- **Rate limiting**: In-memory con cleanup automático - Limita requests por IP para prevenir abuso
- **CORS**: Configurado para dominios específicos - Solo permite requests de dominios autorizados
- **Prisma**: Queries parametrizadas (SQL injection protection) - Previene inyección SQL
- **bcryptjs**: Hash de contraseñas - Nunca se guardan contraseñas en texto plano
- **Gitignore**: Archivos sensibles excluidos (.env, .env.local) - Credenciales nunca se commitean
- **Pool de conexiones**: Límite de 5 conexiones DB - Previene saturación de la DB

### Auditoría de Seguridad

- Scan completo de dependencias: **Sin malware encontrado** - Análisis de todas las librerías
- Credenciales en `.env` (gitignored) - Almacenamiento seguro de secrets
- Sin vulnerabilidades críticas en dependencias - Todas las dependencias están actualizadas

### Rate Limiting (`src/lib/rate-limit.ts`)

- Store in-memory con cleanup periódico - No necesita DB externa
- Configurable por IP y ventana de tiempo - Flexible según necesidad

---

## Testing

### Vitest (Unit Tests)

**Vitest** es un framework de testing unitario rápido y moderno para proyectos Vite/TypeScript. Es compatible con la API de Jest pero más veloz.

- Tests unitarios de utilidades - Prueba funciones individuales
- Config: `vitest.config.ts`

### Playwright (E2E Tests)

**Playwright** es un framework de testing end-to-end que automatiza navegadores reales (Chromium, Firefox, WebKit) para testear flujos completos de usuario.

- Tests de flujo de compra completo - Simula un usuario real comprando
- Config: `playwright.config.ts`
- Browser: Chromium - Navegador Google Chrome/Edge
- data-testid attributes en elementos clave - Selectores estables para tests

### Comandos

```bash
pnpm test          # Vitest - Ejecuta todos los tests unitarios
pnpm test:e2e      # Playwright - Ejecuta tests E2E
pnpm test:e2e:ui   # Playwright UI mode - Interfaz gráfica para debug
```

---

## Variables de Entorno

### Requeridas

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL (Neon) - Cadena de conexión a la DB |
| `NEXTAUTH_SECRET` | Secret para NextAuth - Clave para firmar sesiones |
| `NEXTAUTH_URL` | URL base (localhost:3000 / prod) - URL del sitio |
| `MERCADOPAGO_ACCESS_TOKEN` | Token MercadoPago - Credencial para API de pagos |
| `SENDGRID_API_KEY` | API Key SendGrid - Credencial para envío de emails |
| `RESEND_API_KEY` | API Key Resend - Credencial backup de emails |
| `CLOUDINARY_CLOUD_NAME` | Cloud name Cloudinary - Nombre del workspace de imágenes |
| `CLOUDINARY_API_KEY` | API key Cloudinary - Credencial para uploads |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary - Secret para uploads |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID - Credencial OAuth de Google |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret - Secret OAuth de Google |

### Seguridad

- Nunca commitear `.env` o `.env.local` - Contienen credenciales reales
- Usar `.env.example` como plantilla - Versión sin credenciales para referencia

---

## Pendiente / Roadmap

- [ ] Configurar Google OAuth credentials
- [ ] Implementar página de Vender (cotización)
- [ ] Implementar página de Servicio (reparaciones)
- [ ] Implementar página de Notebooks
- [ ] Implementar página de Mayorista
- [ ] Implementar página de Comparar
- [ ] Sistema de cupones de descuento
- [ ] Blog / CMS
- [ ] Analytics avanzados
- [ ] App móvil (React Native)

---

*Documento generado: Junio 2026*
*Última actualización: v0.1.0*
