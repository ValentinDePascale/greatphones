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

### Un producto = Un dispositivo (modelo + almacenamiento)
```
Catálogo público → /productos
├─ iPhone 15 Pro 256GB (isPreorder: true)
│  ├─ Negro - $1,200,000 - Disponible en 7 días
│  ├─ Azul - $1,250,000 - Disponible en 7 días
│  └─ Titanio - $1,300,000 - Disponible en 12 días
```

### En la tarjeta del producto:
- Muestra el **precio mínimo** (Negro: $1,200,000)
- Dice "**Desde X colores disponibles**"
- Indica "**Stock disponible en X días - Reservar ahora**"

### Cuando el usuario abre el producto:
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
Catálogo: iPhone 15 Pro 256GB (stock: 50)
- Precio: $1,199,999
- Stock disponible ahora
```

### Después (con preventa agregada)
```
Catálogo: iPhone 15 Pro 256GB (isPreorder: true, stock: 0)
- Precio: $1,200,000 (precio mínimo de variantes)
- Images (campo JSON): [
    { color: "Negro", precio: 1200000, disponibleEn: "2026-10-15" },
    { color: "Azul", precio: 1250000, disponibleEn: "2026-10-15" },
    { color: "Titanio", precio: 1300000, disponibleEn: "2026-10-20" }
  ]
- Disponible en X días - Reservar ahora
```

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

### 2. Frontend: Envía al API
```
POST /api/admin/preorders/bulk
{
  preventas: [
    {
      modelo: "iPhone 15 Pro",
      almacenamiento: "256GB",
      imageUrl: "...",
      color: "Negro",
      precio: 1200000,
      fecha: "2026-10-15"
    },
    {
      modelo: "iPhone 15 Pro",
      almacenamiento: "256GB",
      imageUrl: "...",
      color: "Azul",
      precio: 1250000,
      fecha: "2026-10-15"
    }
  ]
}
```

### 3. API: Agrupa y crea productos
```javascript
// Agrupa por modelo + almacenamiento
grouped = {
  "iPhone 15 Pro|256GB": {
    variantes: [...]
  }
}

// Crea UN producto por grupo
for cada grupo:
  Product.create({
    name: "iPhone 15 Pro",
    sub: "256GB",
    isPreorder: true,
    stock: 0,
    images: JSON.stringify([
      { color: "Negro", precio: 1200000, disponibleEn: "2026-10-15" },
      { color: "Azul", precio: 1250000, disponibleEn: "2026-10-15" }
    ])
  })
```

### 4. API: Limpia cache
```javascript
productCache.clear()
// El producto aparece inmediatamente en catálogo
```

### 5. Base de datos
```sql
SELECT * FROM products WHERE isPreorder = true;

id: "xyz123"
name: "iPhone 15 Pro"
sub: "256GB"
price: 1200000  -- Precio mínimo
stock: 0
isPreorder: true
images: [
  { color: "Negro", precio: 1200000, disponibleEn: "2026-10-15" },
  { color: "Azul", precio: 1250000, disponibleEn: "2026-10-15" }
]
```

---

## Endpoints Relevantes

### GET `/api/admin/precios`
Obtiene la lista de dispositivos disponibles para agregar preventas
- Parámetros: ninguno (usa authenticate)
- Retorna: Array de PriceListItem

### POST `/api/admin/preorders/bulk`
Publica las preventas agregadas como productos en catálogo
- Body: `{ preventas: Array }`
- Retorna: `{ success: true, productosCreados: [], total: number }`

### GET `/api/products?preorder=false`
Obtiene productos normales (excluye preventas) en admin
- Admin: exclude preorder by default
- Público: mostrar todas

---

## Preguntas Frecuentes

**P: ¿Puedo agregar el mismo dispositivo dos veces?**
R: Sí, se agruparán automáticamente. Si agregas iPhone 15 Pro 256GB dos veces con diferentes colores, en el panel lateral se verán como UN SOLO dispositivo con todos los colores.

**P: ¿Qué pasa si cambio el precio después de publicar?**
R: Debes crear una nueva preventa. Los productos ya publicados no se actualizan automáticamente.

**P: ¿Se puede reservar desde el catálogo?**
R: Sí, los clientes verán un botón "Reservar ahora" en lugar de "Comprar" para productos con preventa.

**P: ¿Dónde aparecen en el admin?**
R: En `/admin/stock` y `/admin/productos` NO aparecen (isPreorder=true los excluye). Solo aparecen en el catálogo público (`/productos`).

**P: ¿Cuándo se elimina una preventa?**
R: Las preventas son permanentes. Para "desactivarla", debes marcar el producto como eliminado desde `/admin/productos` (si fuera visible).

---

## Solución de Problemas

### "Producto no encontrado"
**Causa:** El ID del dispositivo no es válido o no existe en Lista de Precios
**Solución:** Verifica que el dispositivo esté en `GET /api/admin/precios`

### "0 preventas agregadas"
**Causa:** Error al publicar (ver logs del servidor)
**Solución:** Revisar que todos los campos sean válidos (precio > 0, fecha futura)

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
