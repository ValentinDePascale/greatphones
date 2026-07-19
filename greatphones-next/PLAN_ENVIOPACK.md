# Plan: Integración Envío Pack (Multicarreo)

## Resumen
Reemplazar la integración单一 con Andreani por Envío Pack (agregador logístico), permitiendo al usuario elegir entre múltiples correos al comprar, con cotización en tiempo real, tracking post-venta y pasos de seguimiento.

## Arquitectura

```
Checkout → POST /api/shipping/enviopack/cotizar → Envío Pack API → Retorna opciones multicarreo
         → Usuario elige opción → Pago → Order creada con carrier + tracking
         → POST /api/shipping/enviopack/crear → Envío Pack crea envío → Retorna tracking
         → Email con tracking → Pagina de seguimiento con timeline del carrier
```

## Cambios por Archivo

### 1. Backend — Nueva API Route: `src/app/api/shipping/enviopack/route.ts` (NUEVO)

```typescript
// Auth: JWT via POST a /auth con api-key + secret-key
// Token válido ~4h, enviado como query param ?access_token=

// POST /api/shipping/enviopack/cotizar
// Body: { cpOrigen, cpDestino, peso, largo, ancho, alto, valor }
// Envío Pack retorna opciones de múltiples correos con costo
// Respuesta: { options: [{ correo, service, costo, diasEstimados, peso }] }

// POST /api/shipping/enviopack/crear
// Body: { orderId, carrier, service, destino: { nombre, email, telefono, dni, domicilio, cp, localidad, provincia } }
// Crea pedido + envío en Envío Pack
// Respuesta: { trackingNumber, etiquetaUrl, carrier }
```

### 2. Backend — Checkout: `src/app/api/checkout/route.ts` (MODIFICAR)

- Agregar campos `carrier` y `carrierService` al Order create
- Guardar `enviopackId` (ID del envío en Envío Pack) para tracking
- After MP payment confirmed → llamar a `/api/shipping/enviopack/crear` para generar envío

### 3. Backend — Prisma Schema: `prisma/schema.prisma` (MODIFICAR)

```prisma
model Order {
  // ...existente...
  carrier        String?    // "Andreani", "OCA", "Correo Argentino", etc.
  carrierService String?    // "Estándar", "Express", etc.
  enviopackId    String?    // ID del envío en Envío Pack
  trackingUrl    String?    // URL de tracking del carrier
}
```

### 4. Backend — Webhook: `src/app/api/webhooks/mercadopago/route.ts` (MODIFICAR)

- After payment approved → crear envío en Envío Pack si delivery ≠ "Retiro en tienda"
- Enviar email con número de tracking y carrier

### 5. Frontend — Checkout: `public/lib/checkout.js` (MODIFICAR)

Reemplazar la sección de delivery step 2:

**Antes:** 3 opciones hardcodeadas (Retiro, Express, Andreani)
**Después:**
- Retiro en Tienda (gratis)
- Express Bahía Blanca (gratis, $5000)
- Envío a todo el país → Desplegar selector de opciones multicarreo:
  - Botón "Calcular envío" que llama a `/api/shipping/enviopack/cotizar`
  - Muestra opciones: logo del correo + nombre + precio + días estimados
  - Usuario selecciona una opción
  - Se actualiza el total con el costo del envío seleccionado

### 6. Frontend — HTML: `public/index.html` (MODIFICAR)

Modificar el `checkout-delivery` div (línea 2371):

```html
<!-- Reemplazar el botón "Envío Argentina" con: -->
<div class="delivery-btn" data-d="enviopack" onclick="selCheckoutDelivery(this,'enviopack')">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:14px;font-weight:600">Envío a todo el país</span>
    <span id="enviopack-price" style="color:var(--orange);font-weight:700;font-size:14px">Calcular</span>
  </div>
  <div style="font-size:12px;color:var(--gray);margin-top:3px">Múltiples opciones de correo</div>
  <button id="btn-calc-shipping" onclick="event.stopPropagation();calcEnvioPackShipping()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    Calcular envío
  </button>
</div>

<!-- Nuevo: contenedor para opciones multicarreo -->
<div id="enviopack-options" style="display:none;margin-top:12px;max-height:300px;overflow-y:auto"></div>
```

### 7. Frontend — Checkout JS: `public/lib/checkout.js` (NUEVAS FUNCIONES)

```javascript
// calcEnvioPackShipping() - llama a API y muestra opciones
// renderEnvioPackOptions(options) - renderiza cards de opciones con logos
// selectEnvioPackOption(option) - selecciona una opción y actualiza total
// getCarrierLogo(carrier) - retorna SVG del carrier
```

### 8. Frontend — Tracking: `public/lib/render.js` (MODIFICAR)

Mejorar `loadOrderTracking()`:
- Mostrar carrier y service en el timeline
- Agregar link de tracking del carrier (si disponible)
- Agregar timeline con pasos del carrier (Retirado → En tránsito → Entregado)

### 9. Frontend — Success Page: `src/app/success/SuccessContent.tsx` (MODIFICAR)

- Mostrar carrier y número de tracking después del pago
- Link a la página de tracking del carrier

## Diseño UI — Selector Multicarreo

### Card de Opción de Envío
```
┌─────────────────────────────────────────────┐
│ [Logo]  Andreani - Estándar                  │
│         $8.500 · 3-5 días hábiles            │
│         ★ Más economico                      │
├─────────────────────────────────────────────┤
│ [Logo]  OCA - Prioritario                    │
│         $12.000 · 2-3 días hábiles           │
│         ⚡ Más rápido                        │
├─────────────────────────────────────────────┤
│ [Logo]  Correo Argentino - Común             │
│         $7.500 · 5-8 días hábiles            │
└─────────────────────────────────────────────┘
```

### Estilo
- Cards redondeadas (border-radius: 12px)
- Borde naranja en la opción seleccionada
- Logo del carrier a la izquierda (SVG inline o imagen)
- Precio en naranja bold
- Badge "Más económico" o "Más rápido" según corresponda
- Hover: borde gris oscuro

## Pasos de Implementación

### Fase 1: Backend
1. Crear rama `feature/enviopack-shipping` desde `dev`
2. Crear route `src/app/api/shipping/enviopack/route.ts`
3. Modificar Prisma schema (carrier, carrierService, enviopackId, trackingUrl)
4. Ejecutar `prisma db push`
5. Modificar checkout route para guardar carrier
6. Modificar webhook para crear envío post-pago
7. Commit

### Fase 2: Frontend — Checkout
8. Modificar `index.html` (reemplazar delivery step 2)
9. Modificar `checkout.js` (nuevas funciones multicarreo)
10. Agregar estilos para opciones de envío en `globals.css` o inline
11. Commit

### Fase 3: Tracking
12. Modificar `render.js` — mejora de `loadOrderTracking()`
13. Modificar `SuccessContent.tsx` — mostrar tracking post-pago
14. Commit

### Fase 4: Testing
15. Probar cotización con CP de prueba
16. Probar flujo completo: checkout → pago → envío → tracking
17. Verificar emails con tracking

## Variables de Entorno Requeridas

```env
ENVIOPACK_API_KEY=tu_api_key
ENVIOPACK_SECRET_KEY=tu_secret_key
```

## APIs de Envío Pack

- **Auth**: `POST https://api.enviopack.com/auth` body: `{ "api-key": "...", "secret-key": "..." }`
- **Cotizar**: `GET https://api.enviopack.com/cotizar/costo?cpOrigen=8000&cpDestino=1425&peso=1&largo=20&ancho=20&alto=20&valor=50000&access_token=...`
- **Crear envío**: `POST https://api.enviopack.com/envios` body: `{ pedido, envio }`
- **Etiqueta**: `POST https://api.enviopack.com/etiquetas/{idEnvio}`
- **Tracking**: `GET https://api.enviopack.com/envios/{idEnvio}/tracking`

## Riesgo / Notas

- Envío Pack no tiene SDK, todo es HTTP directo
- Token JWT dura ~4h, hay que refrescar
- Credenciales necesarias: `api-key` + `secret-key` desde `https://app.enviopack.com/configuracion/integraciones`
- El CP de origen es Bahía Blanca: `8000`
- Validación: CP destino debe tener 4 dígitos
