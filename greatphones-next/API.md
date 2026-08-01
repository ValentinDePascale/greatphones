# API Reference

Base URL: `http://localhost:3000/api` (dev) / `https://greatphones.com.ar/api` (prod)

## Auth

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/signup` | — | Registro de usuario |
| POST | `/auth/signin` | — | Login (email + password) |
| POST | `/auth/logout` | — | Cierra sesión (limpia cookie) |
| GET | `/auth/me` | cookie | Sesión actual (NextAuth o JWT) |
| POST | `/auth/forgot-password` | — | Envía código de reseteo por email |
| POST | `/auth/reset-password` | — | Cambia contraseña con código |
| POST | `/auth/verify-email` | — | Verifica email (send / verify) |
| POST | `/auth/verify-token` | — | Valida token de sesión |
| PUT | `/auth/update` | session | Actualiza perfil |
| DELETE | `/auth/delete` | admin | Elimina cuenta |

## Products

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/products` | — | Listado (filtros: brand, isOffer, minPrice, maxPrice, search, limit, page) |
| GET | `/products/[id]` | — | Detalle de producto |
| POST | `/products` | admin | Crear producto |
| PUT | `/products/[id]` | admin | Actualizar producto |
| DELETE | `/products` | admin | Eliminar producto (?id=) |
| GET | `/products/export` | admin | Exportar a Excel |

## Accessories

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/accessories` | — | Listado |
| POST | `/accessories` | admin | Crear |
| PUT | `/accessories` | admin | Actualizar |
| DELETE | `/accessories` | admin | Eliminar |

## Cart

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/cart` | session | Obtener carrito persistido |
| POST | `/cart` | session | Sincronizar carrito completo |

## Checkout

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/checkout` | — | Crear orden + preferencia MP |

## Orders

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/orders` | — | Listado (?userId= / ?admin=true) |
| POST | `/orders` | admin | Crear orden manual |
| PUT | `/orders` | admin | Actualizar estado |
| DELETE | `/orders` | admin | Eliminar orden |
| GET | `/orders/track` | — | Tracking por código + email |

## Wallet

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/wallet` | session | Saldo + datos de billetera |
| POST | `/wallet/pay` | session | Pagar con saldo de billetera |
| GET | `/wallet/transactions` | session | Historial de transacciones |

## Gift Cards

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/giftcard/preference` | session | Crear gift card + preferencia MP |
| GET | `/giftcard/confirm` | session | Obtener código (post-pago) |
| GET | `/giftcard/check` | — | Verificar validez por código |
| POST | `/giftcard/redeem` | session | Canjear gift card por saldo |

## Coupons

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/coupons` | session | Listar cupones del usuario |

## Favorites

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/favorites` | session | Listar favoritos |
| POST | `/favorites` | session | Agregar a favoritos |
| DELETE | `/favorites` | session | Quitar de favoritos |

## Warranty

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/warranty` | — | Consultar garantía (?code= & ?imei=) |
| POST | `/warranty/preference` | session | Comprar extensión (crea preferencia MP) |
| POST | `/warranty/confirm` | session | Confirmar extensión post-pago |
| POST | `/warranty/extend` | admin | Extender garantía manualmente |

## Inventory

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/inventory` | admin | Listado de items (filtros: status, productId, supplierId) |
| POST | `/inventory` | admin | Crear item (IMEI único) |
| GET | `/inventory/[id]` | admin | Detalle con historial |
| PUT | `/inventory/[id]` | admin | Actualizar item |
| DELETE | `/inventory/[id]` | admin | Eliminar item |
| PATCH | `/inventory/[id]/status` | admin | Cambiar estado |
| POST | `/inventory/[id]/sell` | admin | Marcar como vendido |
| GET | `/inventory/[id]/history` | admin | Historial del item |
| POST | `/inventory/lookup-imei` | admin | Buscar info de IMEI (TAC DB) |

## Shipping

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/shipping/enviopack` | — | Cotizar envío (Envío Pack) |
| POST | `/shipping/enviopack/crear` | admin | Crear envío |
| POST | `/shipping/andreani` | session | Cotizar envío (Andreani) |

## Admin

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | admin | Métricas del dashboard |
| GET | `/admin/sales-history` | admin | Historial de ventas combinado |
| GET | `/admin/users` | admin | Listado de usuarios |
| GET | `/admin/quotes-stats` | admin | Estadísticas de cotizaciones |
| GET | `/admin/preorders` | admin | Listado de preórdenes |
| GET/PATCH | `/admin/preorders/[id]` | admin | Detalle / actualizar preorden |
| POST | `/admin/instore-sale` | admin | Crear venta en tienda |
| POST | `/admin/instore-sale/[id]/approve` | admin | Aprobar venta pendiente |
| POST | `/admin/instore-sale/[id]/cancel` | admin | Cancelar venta |
| POST | `/admin/instore-sale/verify-payment` | admin | Verificar pago MP |
| POST | `/admin/instore-sale/send-receipt` | admin | Enviar recibo por email |
| GET/PATCH | `/admin/arrepentimientos` | admin | Listar / actualizar arrepentimientos |
| GET/POST | `/admin/conversations` | admin | Listar / crear conversaciones admin |
| GET/POST | `/admin/canned-replies` | admin | Respuestas predefinidas |

## Other

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/upload` | admin | Subir imagen a Cloudinary |
| POST | `/quotes` | — | Crear cotización |
| GET/PATCH | `/quotes` | admin | Listar / actualizar cotizaciones |
| POST | `/arrepentimiento` | session | Crear solicitud de arrepentimiento |
| PUT | `/arrepentimiento` | admin | Procesar arrepentimiento |
| POST | `/notifications` | session | Crear notificación |
| GET | `/notifications` | session | Listar notificaciones |
| POST | `/notifications/[id]/read` | session | Marcar leída |
| POST | `/notifications/read-all` | session | Marcar todas leídas |
| POST | `/notifications/clear-all` | session | Limpiar todas |
| GET | `/conversations` | session | Listar conversaciones |
| POST | `/conversations` | session | Crear conversación |
| GET | `/conversations/[id]` | session | Detalle de conversación |
| GET | `/conversations/[id]/messages` | session | Mensajes de conversación |
| POST | `/conversations/[id]/messages` | session | Enviar mensaje |
| POST | `/conversations/[id]/read` | session | Marcar mensajes leídos |
| GET | `/suppliers` | admin | Listar proveedores |
| POST | `/suppliers` | admin | Crear proveedor |
| GET | `/health` | — | Health check (DB status + uptime) |

## Webhooks

| Method | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/webhooks/mercadopago` | MP signature | Confirmación de pago MP |

## Auth Levels

| Nivel | Significado | Mecanismo |
|-------|-------------|-----------|
| `—` | Público | Sin autenticación |
| `session` | Usuario autenticado | Cookie JWT `gp-session` o NextAuth |
| `admin` | Administrador | Cookie JWT con `role === 'ADMIN'` |
| `MP signature` | Webhook | `x-signature` header (HMAC-SHA256 + timestamp) |

## Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| signin | 5 | 15 min |
| signup | 3 | 1 h |
| forgot-password | 5 | 1 h |
| reset-password | 5 | 1 h |
| verify-email code | 10 | 15 min |
| checkout | 10 | 5 min |
| enviopack | 10 | 1 min |
| andreani | 20 | 1 min |
| warranty check | 30 | 1 min |
| giftcard check | 20 | 1 min |
| orders track | 15 | 1 min |
| giftcard redeem | 10 | 5 min |
