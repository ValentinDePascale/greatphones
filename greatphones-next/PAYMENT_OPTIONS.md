# Opciones de Pago - Great Phones Argentina

Comparativa de pasarelas de pago para ecommerce en Argentina (2026).

---

## Resumen Rápido

| Pasarela | Comisión (tarjeta) | Comisión (transferencia) | Acreditación | Cuotas | Fácil integración |
|----------|-------------------|--------------------------|--------------|--------|-------------------|
| **MercadoPago** | 3.99-6.49% + IVA | 3.49% | 10-21 días (o inmediato 6.49%) | ✅ Hasta 12 | ✅ Muy fácil |
| **Talo** | ❌ No procesa | 0.8-1% | Instantánea | ❌ | ✅ Fácil |
| **Mobbex** | ~4% + IVA | ✅ Sí | 5 días | ✅ | ✅ Fácil |
| **Ualá Bis** | 4.9% + IVA (crédito) | 2.9% (débito) | Variable | ✅ Plan Z | ⚠️ Links de pago |
| **Payway** | 5.69% (1 día) / 1.8% (18 días) | ✅ Sí | 1-18 días | ✅ | ⚠️ Enterprise |
| **Todo Pago** | 2.95% + IVA | ✅ Sí | 2-3 días | ✅ | ✅ Fácil |
| **Stripe** | 2.9% + $0.30 USD | ❌ | 2-7 días | ❌ (global) | ✅ Muy fácil |

---

## Pasarelas Detalladas

### 1. MercadoPago (Actual)

**El más usado en Argentina (69% del mercado)**

| Aspecto | Detalle |
|---------|---------|
| Comisión tarjeta crédito | 3.99-6.49% + IVA |
| Comisión tarjeta débito | 2.49-3.99% + IVA |
| Comisión transferencia | 3.49% |
| Comisión QR | 0% (promoción usuarios) |
| Acreditación | Instantánea (6.49%) o 35 días (1.79%) |
| Cuotas sin interés | ✅ Hasta 12 (costo 5-25% para comercio) |

**Ventajas:**
- Máxima reconocimiento y confianza del consumidor
- Checkout optimizado que convierte bien
- Cuotas sin interés (determinante en Argentina)
- QR interoperable
- Mercado Crédito para clientes

**Desventajas:**
- Comisiones más altas del mercado
- Puede retener fondos sin aviso previo
- Acreditación lenta sin pagar comisión extra
- Soporte limitado para comercios pequeños

---

### 2. Talo (La Más Barata)

**Especialista en transferencias bancarias automáticas**

| Aspecto | Detalle |
|---------|---------|
| Comisión transferencias | 0.8-1% (la más baja de Argentina) |
| Acreditación | Instantánea |
| Contracargos | ❌ No existen |
| Crypto | ✅ USDT, USDC, DAI, Binance Pay |
| Pix (Brasil) | ✅ |
| Integraciones | Tiendanube, Shopify, WooCommerce |
| Costo mensual | $0 |

**Cómo funciona:**
- Cada orden genera un CVU y alias único
- Cliente transfiere desde cualquier banco o billetera
- Talo detecta y confirma automáticamente (24/7)
- Dinero disponible al instante

**Ventajas:**
- Comisión bajísima (0.8-1%)
- Liquidación instantánea
- Sin contracargos (transferencias irreversibles)
- Sin costos de setup ni mensuales

**Desventajas:**
- ❌ No procesa tarjetas de crédito
- No ofrece cuotas
- No tiene QR

---

### 3. Mobbex (All-in-One)

**Procesador argentino con 60k+ comercios activos**

| Aspecto | Detalle |
|---------|---------|
| Comisión tarjetas | ~4% + IVA |
| Métodos de pago | Tarjetas, QR, transferencias, crypto |
| Crypto | Binance Pay |
| Acreditación | 5 días hábiles |
| Integraciones | Tiendanube, Shopify, WooCommerce |

**Ventajas:**
- Acepta todos los métodos en un solo lugar
- Crypto vía Binance Pay
- Portal de desarrolladores completo

**Desventajas:**
- Comisión más alta que Talo
- Acreditación en 5 días

---

### 4. Ualá Bis (Emprendedores)

**Links de pago sin costos fijos**

| Aspecto | Detalle |
|---------|---------|
| Comisión crédito | 4.9% + IVA |
| Comisión débito | 2.9% + IVA |
| Costos fijos | $0 |
| Plan Z | BNPL (cuotas sin tarjeta) |
| Método | Links de pago |

**Ventajas:**
- Sin costo de apertura ni mantenimiento
- Links de pago fáciles de usar
- Plan Z para cuotas sin tarjeta

**Desventajas:**
- Integraciones ecommerce limitadas
- No tiene confirmación automática de transferencias

---

### 5. TodoPago / Payway (Enterprise)

**Respaldado por Prisma (Red Visa/Mastercard)**

| Aspecto | Detalle |
|---------|---------|
| Comisión | 2.95% (8 días) / 1.8% (18 días) |
| Acreditación | 2-3 días hábiles |
| Respaldo | Banco Santander |

**Ventajas:**
- Comisiones competitivas para alto volumen
- Acreditación más rápida que MP
- Procesa todas las tarjetas argentinas

**Desventajas:**
- Menos conocido que MP
- Orientado a empresas medianas/grandes
- Integraciones más limitadas

---

### 6. Stripe (Internacional)

**Líder global, limitado en Argentina**

| Aspecto | Detalle |
|---------|---------|
| Comisión | 2.9% + $0.30 USD |
| Para Argentina | Solo con cuenta bancaria en el exterior |
| Cuotas argentinas | ❌ No ofrece |
| Acreditación | 2-7 días |

**Ventajas:**
- Mejor API técnica del mercado
- Documentación excelente
- Acepta tarjetas internacionales

**Desventajas:**
- No funciona bien para B2C local
- No ofrece cuotas argentinas
- Requiere cuenta en el exterior

---

## Estrategia Recomendada para Great Phones

### Combinación Óptima: MercadoPago + Talo

```
┌─────────────────────────────────────────────────────┐
│  CHECKOUT                                           │
│                                                     │
│  💳 Tarjeta de crédito/débito → MercadoPago         │
│     (3.99-6.49% + IVA, acepta cuotas)              │
│                                                     │
│  🏦 Transferencia bancaria → Talo                   │
│     (0.8-1%, liquidación instantánea)               │
│                                                     │
│  📱 QR MercadoPago → MP                             │
│     (0% comisión)                                   │
│                                                     │
│  💰 Efectivo → MP (Rapipago/Pago Fácil)            │
│     (3.99% + IVA)                                   │
└─────────────────────────────────────────────────────┘
```

### Por qué esta combinación:

1. **MercadoPago** es obligatorio para cuotas
   - El 60% del ecommerce argentino paga en cuotas
   - Sin cuotas, perdés 20-30% de conversión
   - MP tiene el checkout más reconocido

2. **Talo** ahorra una fortuna en transferencias
   - 24.5% del mercado ya paga por transferencia
   - Comisión del 1% vs 6.49% de MP
   - Liquidación instantánea vs 35 días

3. **Descuento por transferencia** incentiva el método más barato
   - Ofrecé 5-10% de descuento por transferencia
   - Muchos clientes prefieren transferir para ahorrar
   - Ganás margen aunque descontés

### Ahorro Estimado

**Escenario: Facturación de $5.000.000 ARS/mes**

| Estrategia | Distribución | Comisión promedio | Costo mensual |
|------------|--------------|-------------------|---------------|
| Solo MP (actual) | 100% MP | 6.49% | $324.500 |
| MP + Talo (60/40) | 60% MP / 40% Talo | ~4.29% | $214.700 |
| **Ahorro mensual** | | | **$109.800** |
| **Ahorro anual** | | | **$1.317.600** |

---

## Métodos de Pago en Argentina (Contexto 2026)

### Distribución actual del mercado

| Método | Participación | Tendencia |
|--------|---------------|-----------|
| Tarjeta de crédito | 35% | Estable |
| Tarjeta de débito | 18% | Creciendo |
| Transferencia bancaria | 24.5% | +37% interanual |
| Efectivo (Rapipago/PF) | 12% | Bajando |
| QR / Billeteras | 8% | Creciendo |
| Cuotas sin tarjeta (BNPL) | 2.5% | Nuevo |

### Datos clave:

- Las transferencias crecieron 37% en el último año
- El 60% de compras son en cuotas
- QR crece rápido (Mercado Pago + MODO)
- Efectivo pierde participación

---

## Implementación Técnica

### MercadoPago (ya implementado)

```typescript
// POST /api/checkout → Crea preference
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preference = new Preference(client);

const result = await preference.create({
  body: { items, back_urls, ... }
});
```

### Talo (pendiente de implementar)

```typescript
// Requerimientos:
// 1. Crear cuenta en talo.com.ar
// 2. Obtener API key
// 3. Crear POST /api/checkout/talo

// Ejemplo de integración:
const taloRes = await fetch('https://api.talo.com.ar/v1/orders', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + process.env.TALO_API_KEY },
  body: JSON.stringify({
    external_id: orderCode,
    amount: total,
    description: 'Compra Great Phones',
    cvu: generatedCVU,
  })
});
```

---

## Comparativa para Decidir

### Si vendés productos B2C (como Great Phones):

| Prioridad | Recomendación |
|-----------|---------------|
| Máxima conversión | MercadoPago (obligatorio) |
| Mejor margen | Talo para transferencias |
| Costo total más bajo | Combinar ambas (60/40) |
| Simpleza | Solo MercadoPago |

### Si tu ticket promedio es alto (>$100.000):

| Opción | Conviene porque |
|--------|-----------------|
| Talo | 1% de $100.000 = $1.000 vs MP: $6.490 |
| Transferencia con descuento | Cliente ahorra, vos ahorras |

### Si tu público paga mucho en cuotas:

| Opción | Conviene porque |
|--------|-----------------|
| MercadoPago | Único que ofrece cuotas locales |
| Ualá Bis | Plan Z (cuotas sin tarjeta) |

---

## Checklist antes de agregar una nueva pasarela

- [ ] Verificar que la API está documentada
- [ ] Crear cuenta de desarrollador
- [ ] Obtener credenciales (API key, secret)
- [ ] Configurar variables de entorno
- [ ] Crear API route para checkout
- [ ] Implementar webhook de confirmación
- [ ] Agregar opción en el frontend
- [ ] Testear flujo completo
- [ ] Verificar acreditación

---

## Fuentes

- [Guía Software - Mejor pasarela pago Argentina 2026](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-argentina)
- [Talo - Alternativas Mercado Pago](https://talo.com.ar/blogs/alternativas-mercado-pago)
- [Talo vs Mercado Pago](https://talo.com.ar/blogs/talo-vs-mercado-pago)
- [Pixelwebs - Pasarelas pago ecommerce Argentina](https://pixelwebs.net/pasarelas-pago-seguridad-ecommerce-argentina/)
- [Commercy - Costo tienda online Argentina](https://commercy.com.ar/blog/costo-ecommerce-argentina)

---

*Documento generado: Junio 2026*
*Última actualización: v0.1.0*
