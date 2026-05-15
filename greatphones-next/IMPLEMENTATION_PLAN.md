# Plan de Implementación: Pagos + Facturación Electrónica

## Estado Actual

| Componente | Estado | Problemas |
|------------|--------|-----------|
| Mercado Pago SDK | ✅ Instalado (`mercadopago@^2.12.0`) | Sin credenciales en `.env.local` |
| Checkout API | ✅ Implementada | `external_reference` vacío, userId hardcoded |
| Webhook MP | ✅ Implementado | Sin verificación de firma, no idempotente |
| Páginas success/failure/pending | ❌ No existen | El usuario queda perdido después de pagar |
| Emails de confirmación | ❌ No existen | El cliente no recibe nada |
| Stock management | ❌ No existe | No se descuenta stock al pagar |
| Facturación | ❌ Cero infraestructura | Todo por construir |

---

## Fase 1: Completar Mercado Pago (Crítico)

### 1.1 Credenciales
- Agregar `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` a `.env.local`
- Configurar modo sandbox para testing

### 1.2 Páginas de resultado
- `src/app/success/page.tsx` → Confirmación de pago, resumen de orden, link a "Seguir comprando"
- `src/app/failure/page.tsx` → Pago rechazado, botón "Reintentar"
- `src/app/pending/page.tsx` → Pago pendiente (Rapipago/Pago Fácil), muestra cupón

### 1.3 Fix Checkout API (`src/app/api/checkout/route.ts`)
- `external_reference` → usar `order.code` para matching confiable en webhook
- Lookup/creación de usuario desde email en vez de `'anonymous'`
- Fix `identification.type`: `CUIT` en vez de `CNPJ` para Argentina
- Agregar `items.description` para que MP muestre detalle en checkout

### 1.4 Fix Webhook (`src/app/api/webhooks/mercadopago/route.ts`)
- Verificación de firma con `x-signature` header
- Idempotencia: si el payment ya fue procesado, no hacer nada
- Stock deduction al confirmar pago
- Email de confirmación de pago

### 1.5 Email de confirmación (`src/lib/email.ts`)
- `sendOrderConfirmationEmail()` → Se dispara cuando MP confirma pago
- Incluye: código de orden, productos, total, dirección, estado

### 1.6 Checkout form (`public/lib/checkout.js`)
- Agregar selector de cuotas si aplica
- Mostrar resumen claro antes de redirigir a MP

---

## Fase 2: Facturación con TusFacturitas

### 2.1 Schema Prisma - Nuevo modelo `Invoice`
```prisma
model Invoice {
  id            String   @id @default(cuid())
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  invoiceType   String   // "A", "B", "C"
  invoiceNumber String   // "0001-00000042"
  cuit          String?  // CUIT del cliente (tipo A)
  cae           String   // CAE de AFIP
  caeExpiry     DateTime
  total         Int
  issuedAt      DateTime @default(now())
  pdfUrl        String?
  status        String   // "ISSUED", "CANCELLED", "ERROR"
}
```

### 2.2 Checkout form - Campos de facturación
- Selector "Tipo de comprobante": B (Consumidor Final) / A (Responsable Inscripto)
- Si tipo A → mostrar campo CUIT y razón social
- Si tipo B → usar DNI como documento

### 2.3 Servicio de facturación (`src/lib/invoicing.ts`)
- Función `createInvoice(order)` → llama API de TusFacturitas
- Mapeo de datos de orden → payload de TusFacturitas
- Manejo de errores y reintentos

### 2.4 API Endpoint (`src/app/api/invoices/route.ts`)
- `POST /api/invoices` → Crea factura para una orden
- Se dispara automáticamente desde el webhook de MP cuando el pago es aprobado
- Guarda CAE, número, PDF URL en DB

### 2.5 Email de factura (`src/lib/email.ts`)
- `sendInvoiceEmail()` → Envía factura al cliente con link de descarga

### 2.6 Admin UI - Sección Facturas
- Lista de facturas emitidas
- Botón "Reemitir" para facturas con error
- Link para descargar PDF

---

## Fase 3: Integración Completa

### 3.1 Flujo automático completo
```
Cliente completa checkout
    ↓
Crea orden PENDING + preferencia MP
    ↓
Cliente paga en Mercado Pago
    ↓
Webhook recibe payment approved
    ↓
Orden pasa a PROCESSING + descuenta stock
    ↓
Email de confirmación al cliente
    ↓
Crea factura B (o A) vía TusFacturitas
    ↓
Email de factura con PDF al cliente
    ↓
Admin ve pedido en "Pedidos Aceptados"
```

### 3.2 Casos edge
- Webhook duplicado → idempotencia
- Factura falla → retry manual desde admin
- Arrepentimiento después de facturar → nota de crédito automática

---

## Archivos a crear/modificar

| Archivo | Acción | Fase |
|---------|--------|------|
| `.env.local` | Agregar MP credentials + TusFacturitas API key | 1, 2 |
| `src/app/success/page.tsx` | Crear | 1 |
| `src/app/failure/page.tsx` | Crear | 1 |
| `src/app/pending/page.tsx` | Crear | 1 |
| `src/app/api/checkout/route.ts` | Modificar (fixes) | 1 |
| `src/app/api/webhooks/mercadopago/route.ts` | Modificar (firma + idempotencia + stock) | 1 |
| `src/lib/email.ts` | Agregar 2 funciones | 1, 2 |
| `prisma/schema.prisma` | Agregar modelo Invoice | 2 |
| `src/lib/invoicing.ts` | Crear | 2 |
| `src/app/api/invoices/route.ts` | Crear | 2 |
| `public/lib/checkout.js` | Agregar selector tipo factura | 2 |
| `public/lib/admin.js` | Agregar sección facturas | 2 |

---

## Credenciales necesarias

| Servicio | Credencial | Dónde obtenerla |
|----------|-----------|-----------------|
| Mercado Pago | `MP_ACCESS_TOKEN` | mercadopago.com.ar/developers → Tu App |
| Mercado Pago | `MP_PUBLIC_KEY` | Mismo lugar |
| TusFacturitas | `TUSFACTURITAS_API_KEY` | tusfacturitas.com.ar → Panel → API |
| TusFacturitas | `TUSFACTURITAS_ENDPOINT` | Documentación de su API |
