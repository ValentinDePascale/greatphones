# Preventas Online - Documentación

## ¿Qué son las Preventas Online?

Las **Preventas Online** son productos que se agregan al catálogo de la tienda sin stock real, con una fecha de entrega estimada. Los clientes pueden **reservar** estos productos en lugar de comprarlos inmediatamente, indicando que están disponibles en X días.

A diferencia de las **Registra Preventa** (`/admin/ops/preventas`) que crean registros de transacciones, las Preventas Online crean directamente **Productos** en el catálogo.

---

## Flujo Completo

### 1. **Admin: Acceder a Preventas Online**
Ir a `/admin/preventa`

### 2. **Admin: Seleccionar Dispositivos**
- Se muestra un grid de todos los dispositivos disponibles en **Lista de Precios**
- Cada tarjeta muestra:
  - Imagen del dispositivo
  - Modelo (ej: iPhone 15 Pro)
  - Almacenamiento (ej: 256GB)
  - Precio de preventa

### 3. **Admin: Agregar Colores**
Hacer clic en el botón **"Agregar"** de un dispositivo:
- Se abre un modal con los colores disponibles
- **Todos los colores vienen marcados por defecto** (checkboxes)
- Puedes deseleccionar los colores que no quieras
- Ingresa el **precio** (viene sugerido del precio de preventa)
- Ingresa la **fecha de entrega** (viene sugerida +30 días)

**Ejemplo:**
```
Dispositivo: iPhone 15 Pro 256GB
Colores seleccionados: Negro, Azul, Titanio
Precio: $1,200,000
Fecha: 2026-10-15
```

### 4. **Admin: Administrar Preventas Agregadas**
En el panel lateral derecho verás todas las preventas agregadas:

#### Por cada dispositivo:
- Imagen, modelo y almacenamiento
- Cantidad de colores agregados
- Lista de todos los colores con sus detalles

#### Por cada color:
- **Nombre del color**
- **Campo de precio** editable
- **Campo de fecha** editable
- **Botón "Eliminar color"** para quitar esa variante

#### Acciones sobre el dispositivo completo:
- **Botón "Eliminar dispositivo"** para quitar todo el producto

**Ejemplo de administración:**
```
┌─ iPhone 15 Pro 256GB ────────────┐
│ [Imagen del iPhone]              │
│ Almacenamiento: 256GB            │
│ 3 colores agregados              │
│                                  │
│ ├─ Negro                         │
│ │  Precio: [1200000]             │
│ │  Fecha:  [2026-10-15]          │
│ │  [Eliminar color]              │
│ │                                │
│ ├─ Azul                          │
│ │  Precio: [1250000]             │
│ │  Fecha:  [2026-10-15]          │
│ │  [Eliminar color]              │
│ │                                │
│ └─ Titanio                       │
│    Precio: [1300000]             │
│    Fecha:  [2026-10-20]          │
│    [Eliminar color]              │
│                                  │
│ [Eliminar dispositivo]           │
└──────────────────────────────────┘
```

### 5. **Admin: Publicar en Catálogo**
Cuando hayas agregado todos los dispositivos y variantes:
- Botón **"Agregar a página"** en la parte inferior del panel lateral
- Se publican todos como **Productos** en el catálogo
- Mensaje de confirmación: "X productos de preventa agregados"
- La lista se limpia automáticamente

---

## Cómo Aparecen en el Catálogo

### Cada color = un Product real, agrupados por `modelGroup`
Cada variante de color que agregás se guarda como su propio registro
`Product` (`isPreorder: true`, `stock: 0`), y todos los colores de un
mismo dispositivo comparten el mismo `modelGroup`. Es el mecanismo que ya
usa el resto del catálogo para variantes de color/almacenamiento — no es
un campo nuevo ni un JSON embebido.

```
Catálogo público → /productos
modelGroup "pre-iphone-15-pro-256gb"
├─ Product Negro   - $1,200,000 - Disponible en 7 días
├─ Product Azul    - $1,250,000 - Disponible en 7 días
└─ Product Titanio - $1,300,000 - Disponible en 12 días
```

### En la grilla del catálogo:
- `products/route.ts` agrupa los Products preorder por `modelGroup` y
  calcula `progroupMin` (precio del color más barato) y `progroupCount`
  (cantidad de colores) para esa card
- Muestra el **precio mínimo** (Negro: $1,200,000)
- Dice "**Desde X colores disponibles**"
- Indica "**Stock disponible en X días - Reservar ahora**"

### Cuando el usuario abre el producto (`/detail/[id]`):
- El detalle busca todos los Products con el mismo `modelGroup` (variantes hermanas)
- Ve un **selector/lista de colores**
- Para cada color:
  - Nombre del color
  - Precio específico
  - Fecha de entrega
  - Botón **"Reservar"**

**Ejemplo visual en catálogo:**
```
┌─────────────────────────────────┐
│   [iPhone 15 Pro 256GB]         │
│   [   IMAGEN   ]                │
│   Desde $1,200,000              │
│   3 colores disponibles         │
│   Stock disponible en 7 días    │
│   [Reservar ahora]              │
└─────────────────────────────────┘

Al hacer clic → Abre detalle con:
  ○ Negro - $1,200,000 (Entrega: Oct 15)
  ○ Azul - $1,250,000 (Entrega: Oct 15)
  ○ Titanio - $1,300,000 (Entrega: Oct 20)
  [Reservar]
```

---

## Estructura de Datos

### Antes (sin preventa agregada)
```
Producto normal: iPhone 15 Pro 256GB (stock: 50)
- Precio: $1,199,999
- Stock disponible ahora
```

### Después (con preventa agregada) — un Product por color
```
Product { id: "abc1", name: "iPhone 15 Pro", sub: "256GB", color: "Negro",
          modelGroup: "pre-iphone-15-pro-256gb", isPreorder: true, stock: 0,
          price: 1200000, availableFrom: "2026-10-15" }

Product { id: "abc2", name: "iPhone 15 Pro", sub: "256GB", color: "Azul",
          modelGroup: "pre-iphone-15-pro-256gb", isPreorder: true, stock: 0,
          price: 1250000, availableFrom: "2026-10-15" }

Product { id: "abc3", name: "iPhone 15 Pro", sub: "256GB", color: "Titanio",
          modelGroup: "pre-iphone-15-pro-256gb", isPreorder: true, stock: 0,
          price: 1300000, availableFrom: "2026-10-20" }
```
El `modelGroup` compartido es lo que permite que el detalle de producto
los muestre como "un mismo dispositivo con 3 colores".

---

## Administrar lo ya publicado: pestaña "Preventas activas"

`/admin/preventa` tiene dos pestañas:

- **Agregar preventa**: el flujo descrito arriba (grid + modal + panel lateral)
- **Preventas activas**: lista todo lo que ya está publicado en el catálogo,
  agrupado por dispositivo (mismo `modelGroup`)

Esta pestaña **no** es lo mismo que `/admin/productos` ni `/admin/stock` —
esos dos excluyen explícitamente los productos con `isPreorder: true`.
"Preventas activas" es la única vista de administración donde se ven.

Por cada dispositivo se muestra una tarjeta con:
- Imagen, modelo y almacenamiento
- Un bloque por color, con campos editables de **precio** y **fecha**, un
  botón **Guardar** (llama a `PUT /api/products/[id]`) y un botón
  **Eliminar** (llama a `DELETE /api/products/[id]`, borra ese color)
- Un botón **"Eliminar dispositivo del catálogo"** que borra todos los
  colores de ese `modelGroup` de una vez

---

## Diferencias: Preventa Online vs Registra Preventa

| Aspecto | Preventa Online | Registra Preventa |
|---------|-----------------|-------------------|
| **URL** | `/admin/preventa` | `/admin/ops/preventas` |
| **Qué crea** | Productos (isPreorder: true) | PreOrder records |
| **Uso** | Agregar al catálogo online | Registrar ventas locales |
| **Aparece en** | Catálogo público | Historial de transacciones |
| **Contabilidad** | No registra asiento | Registra INGRESO |
| **Cliente** | Comprador online | Cliente presencial |

---

## Casos de Uso

### Caso 1: iPhone nuevo que llega en 2 semanas
1. Ir a `/admin/preventa`
2. Buscar "iPhone 15 Pro" en el grid
3. Hacer clic en "Agregar"
4. Seleccionar todos los colores disponibles
5. Precio: $1,199,999 (sugerido)
6. Fecha: +30 días
7. En el panel lateral: Ajustar precios por color si es necesario
8. Hacer clic en "Agregar a página"
9. Aparece en catálogo como "Stock disponible en 30 días"

### Caso 2: Múltiples dispositivos a la vez
1. Agregar iPhone 15 Pro (3 colores)
2. Agregar Samsung Galaxy S24 (2 colores)
3. Agregar Google Pixel 8 (4 colores)
4. En el panel lateral: Ver todos agrupados por dispositivo
5. Editar variantes si es necesario
6. Hacer clic en "Agregar a página" → Se publican los 3 dispositivos

### Caso 3: Editar una variante después de agregar
1. Dispositivo ya está en la lista
2. Notas que el color "Azul" tiene precio incorrecto
3. En el panel lateral: Editar el precio del color "Azul"
4. Cambiar fecha de entrega si es necesario
5. Al hacer clic en "Agregar a página": Se publica con los cambios

---

## Notas Importantes

### ✅ Lo que SÍ puedes hacer
- Agregar múltiples colores de un mismo dispositivo
- Agregar el mismo dispositivo múltiples veces (se agrupan automáticamente)
- Editar precio y fecha de cada color individualmente
- Eliminar colores específicos sin tocar otros
- Eliminar todo el dispositivo

### ❌ Lo que NO puedes hacer
- Crear variantes sin color
- Publicar preventas sin variantes
- Editar el dispositivo después de publicar (crear una nueva preventa)

### 📝 Restricciones
- Máximo 100 preventas por publicación
- El productId debe existir en Lista de Precios
- Las fechas deben ser futuras
- Los precios deben ser positivos

---

## Flujo Técnico (para desarrolladores)

> **Nota (2026-08-29):** la primera versión de este endpoint guardaba las
> variantes de color como un array de objetos dentro de `Product.images`.
> Ese campo es `String[]` en el schema de Prisma, así que cada `create()`
> fallaba en silencio (el `catch` por-item ocultaba el error) y las
> preventas nunca se publicaban. Se rediseñó para usar el mismo mecanismo
> que ya usa el resto del sitio para variantes de color: un `Product` real
> por color, agrupados por `modelGroup`.

### 1. Frontend: Recolecta datos
```javascript
preventasAgregadas = [
  {
    modelo: "iPhone 15 Pro",
    almacenamiento: "256GB",
    imageUrl: "...",
    variantes: [
      { color: "Negro", precio: 1200000, fecha: "2026-10-15" },
      { color: "Azul", precio: 1250000, fecha: "2026-10-15" }
    ]
  }
]
```

### 2. Frontend: Envía al API (una entrada por color)
```
POST /api/admin/preorders/bulk
{
  preventas: [
    { modelo: "iPhone 15 Pro", almacenamiento: "256GB", imageUrl: "...", color: "Negro", precio: 1200000, fecha: "2026-10-15" },
    { modelo: "iPhone 15 Pro", almacenamiento: "256GB", imageUrl: "...", color: "Azul",  precio: 1250000, fecha: "2026-10-15" }
  ]
}
```

### 3. API: crea UN Product real por color, agrupados por `modelGroup`
```javascript
const modelGroup = `pre-${slugify(modelo)}-${slugify(almacenamiento)}`
// -> "pre-iphone-15-pro-256gb"

// Si ya existe un Product con ese modelGroup + color + isPreorder:true,
// se actualiza (precio/fecha/imagen) en vez de duplicarse.
Product.create({
  name: "iPhone 15 Pro",
  sub: "256GB",
  color: "Negro",
  modelGroup: "pre-iphone-15-pro-256gb",
  isPreorder: true,
  stock: 0,
  price: 1200000,
  availableFrom: new Date("2026-10-15"),
})
// ...un create() más por cada color (Azul, etc.)
```

Este es el mismo campo `modelGroup` que usa `/detail/[id]/page.tsx` para
buscar variantes hermanas y mostrar el selector de color, y el mismo que
usa `products/route.ts` (`progroupMin`/`progroupCount`) para calcular el
"desde $X, N variantes" en las cards del catálogo.

### 4. API: Limpia cache
```javascript
productCache.clear()
// El producto aparece inmediatamente en catálogo
```

### 5. Administración: pestaña "Preventas activas"
`GET /api/products?preorder=true&limit=100` devuelve todos los Products
con `isPreorder:true` (este filtro aplica siempre, sin importar si el
caller es admin). El frontend los agrupa por `modelGroup` en memoria para
mostrar un div por dispositivo con sus variantes. Cada variante se edita
con `PUT /api/products/[id]` (`price`, `availableFrom`) y se elimina con
`DELETE /api/products/[id]` (hard delete — no hay PreOrder ni inventario
real asociado).

### 5. Base de datos
```sql
SELECT * FROM products WHERE isPreorder = true;

id: "abc1" | name: "iPhone 15 Pro" | sub: "256GB" | color: "Negro"
modelGroup: "pre-iphone-15-pro-256gb" | price: 1200000 | stock: 0

id: "abc2" | name: "iPhone 15 Pro" | sub: "256GB" | color: "Azul"
modelGroup: "pre-iphone-15-pro-256gb" | price: 1250000 | stock: 0
```

---

## Endpoints Relevantes

### GET `/api/admin/precios`
Obtiene la lista de dispositivos disponibles para agregar preventas
- Parámetros: ninguno (usa authenticate)
- Retorna: Array de PriceListItem

### POST `/api/admin/preorders/bulk`
Crea/actualiza un Product por cada color enviado (agrupados por modelGroup)
- Body: `{ preventas: [{ modelo, almacenamiento, imageUrl, brand, color, precio, fecha }] }`
- Retorna: `{ success: true, productosCreados: string[], total: number }`

### GET `/api/products?preorder=true&limit=100`
Usado por la pestaña "Preventas activas" para listar todo lo publicado
- Filtra `isPreorder: true` sin importar si el caller es admin
- Retorna: `{ data: Product[], ... }`

### PUT `/api/products/[id]`
Edita precio/fecha de una variante puntual (color)
- Body: `{ price?, availableFrom? }`
- Limpia `productCache` al terminar

### DELETE `/api/products/[id]`
Elimina (hard delete) una variante puntual
- Usado tanto para "Eliminar color" como, en loop, para "Eliminar dispositivo"

### GET `/api/products?preorder=false`
Obtiene productos normales (excluye preventas) cuando el caller es admin
- Público: mostrar todas

---

## Preguntas Frecuentes

**P: ¿Puedo agregar el mismo dispositivo dos veces?**
R: Sí, se agruparán automáticamente. Si agregas iPhone 15 Pro 256GB dos veces con diferentes colores, en el panel lateral se verán como UN SOLO dispositivo con todos los colores.

**P: ¿Qué pasa si cambio el precio después de publicar?**
R: Andá a la pestaña "Preventas activas", editá el precio/fecha de ese color y hacé clic en "Guardar" — no hace falta crear una preventa nueva.

**P: ¿Se puede reservar desde el catálogo?**
R: Sí, los clientes verán un botón "Reservar ahora" en lugar de "Comprar" para productos con preventa.

**P: ¿Dónde aparecen en el admin?**
R: En `/admin/stock` y `/admin/productos` NO aparecen (isPreorder=true los excluye en ambos). La única vista de administración donde se ven es la pestaña "Preventas activas" en `/admin/preventa`.

**P: ¿Cómo elimino una preventa?**
R: En "Preventas activas": "Eliminar" borra solo ese color, "Eliminar dispositivo del catálogo" borra todos los colores de ese modelo. Es un hard delete (no queda soft-deleted como los productos normales).

---

## Solución de Problemas

### "Producto no encontrado" (endpoint viejo, ya no debería aparecer)
Este error era del diseño anterior, que intentaba reutilizar un `productId`
de PriceList como si fuera un `Product`. El endpoint actual ya no depende
de ningún `productId` externo — recibe modelo/almacenamiento/color/precio/fecha
y crea el `Product` de preventa desde cero.

### "0 preventas creadas" / "0 preventas agregadas"
**Causa histórica:** `Product.images` es `String[]` en el schema, pero la
versión anterior del endpoint guardaba ahí un array de objetos
(`{color, precio, disponibleEn}`). Prisma rechazaba el `create()` y el
`catch` por-item lo ocultaba. **Ya corregido** — ahora cada color es un
`Product` normal sin usar `images` para nada especial.
Si volviera a pasar: revisar los logs del servidor, ahí queda el error real.

### Aparece en `/admin/stock`
**Causa histórica:** `renderStockList` (en `public/lib/render.js`) no
filtraba `isPreorder`, a diferencia de `renderAdminProductsFiltered` que
sí lo hacía para `/admin/productos`. **Ya corregido.**

### No aparece en catálogo
**Causa:** Cache de productos no fue limpiado
**Solución:** Refrescar la página, el cache se actualiza automáticamente

### Color no aparece en variantes
**Causa:** El color está deseleccionado en el modal
**Solución:** Reabrir el dispositivo y marcar el color nuevamente

---

## Mejoras Futuras

- [ ] Sincronizar precios de preventa con cambios en Lista de Precios
- [ ] Historial de cambios en preventa
- [ ] Notificación a clientes cuando la preventa llega a stock
- [ ] Descuentos específicos por color
- [ ] Limites de cantidad por color
- [ ] Pausar/reanudar preventa sin eliminar

---

**Última actualización:** 2026-08-29
**Versión:** 1.0
