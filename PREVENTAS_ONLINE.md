# Preventas Online - Documentación

> Actualizado 2026-08-29. `/admin/preventa` usa el componente React
> `PreventaOnlineClient.tsx` (no el panel admin legacy). Este documento
> quedó desactualizado dos veces por indecisión entre ambos sistemas —
> esta versión es la definitiva: se mantiene React.

## ¿Qué son?

Productos en el catálogo público sin stock real, con fecha de entrega
estimada, que el cliente puede reservar. Cada combinación de
color+almacenamiento de un mismo dispositivo es un `Product` real
(`isPreorder: true`, `stock: 0`), agrupados por `modelGroup` — el mismo
mecanismo que usa el resto del sitio para variantes de color/almacenamiento
(`/detail/[id]` arma el selector buscando productos con igual `modelGroup`).

## Dónde vive

- **UI**: `/admin/preventa` → [PreventaOnlineClient.tsx](greatphones-next/src/app/admin/preventa/PreventaOnlineClient.tsx)
- **API**: `POST /api/admin/preorders/bulk` → [route.ts](greatphones-next/src/app/api/admin/preorders/bulk/route.ts)

Dos pestañas: **Agregar preventa** (grid de Lista de Precios + modal de
colores + panel lateral de staging) y **Preventas activas** (lista de lo ya
publicado, agrupado por dispositivo, con editar/eliminar por variante).

## Flujo: Agregar preventa

1. Grid de dispositivos desde `GET /api/admin/precios` (Lista de Precios)
2. Click "Agregar" en un dispositivo → modal con checkboxes de color (todos
   marcados por defecto), precio sugerido (`preventaARS`) y fecha (+30 días
   por defecto)
3. Se agrega al panel lateral de staging, agrupado por `modelo|almacenamiento`
4. "Agregar a página" → `POST /api/admin/preorders/bulk` con un item por
   color: `{ modelo, almacenamiento, imageUrl, brand, color, precio, fecha }`

### Qué hace el endpoint por cada color

```ts
const modelGroup = `pre-${slugify(item.modelo)}`   // SIN almacenamiento
const storage = item.almacenamiento || null
const brand = item.brand || inferBrand(item.modelo) // Lista de Precios no tiene brand

// upsert por (modelGroup, color, storage) — evita duplicar si ya existe
Product.create({
  name: item.modelo, brand, storage, color, modelGroup,
  isPreorder: true, stock: 0, price: item.precio,
  availableFrom: new Date(item.fecha),
})
```

Puntos importantes:

- **`modelGroup` no incluye el almacenamiento.** Así, "iPhone 12 Pro Max
  128GB" y "iPhone 12 Pro Max 256GB" comparten `modelGroup` y aparecen como
  variantes hermanas en el detalle (el almacenamiento es un eje de variante
  más, igual que el color) — antes cada almacenamiento generaba un
  `modelGroup` distinto y quedaban como dispositivos separados.
- **`storage` es un campo real del `Product`**, no solo texto dentro de
  `sub`. `renderDetailVariants()` en `public/lib/render.js` lee `v.storage`
  para armar los chips de almacenamiento en el detalle; si no está seteado,
  el selector no tiene datos reales para mostrar.
- **`brand` se infiere del nombre del modelo** (`inferBrand()`): Lista de
  Precios (`PriceList`) no tiene columna `brand`, así que no hay de dónde
  sacarla directamente. Cubre iPhone/iPad/MacBook → Apple, Galaxy →
  Samsung, Redmi/Xiaomi/Poco → Xiaomi, Moto → Motorola, Pixel → Google;
  cualquier otro caso cae en "Otro".

## Cómo se ven en el catálogo público

- **Grilla** (`renderShopGrid` en `render.js`): agrupa por `modelGroup`,
  muestra la variante más barata. La card usa `cheapest.name` como nombre
  a mostrar (no el `modelGroup`, que es un slug interno tipo
  `pre-iphone-12-pro-max` — mostrarlo directamente fue un bug ya corregido).
- **Detalle** (`/detail/[id]`): círculos de color: al elegir un color,
  chips de los almacenamientos disponibles *para ese color* (lee
  `p.storage` de cada variante hermana).

## Pestaña "Preventas activas"

`GET /api/products?preorder=true&limit=100` (este filtro aplica siempre,
sin importar si el caller es admin), agrupado en el cliente por
`modelGroup`. Por dispositivo:

- Header compacto: imagen + nombre + cantidad de variantes + un ícono de
  papelera para borrar todo el dispositivo
- Cada variante es una fila de una línea: `color · almacenamiento ·
  precio`, con dos botones ícono (✏ editar, 🗑 eliminar). "Editar" abre un
  formulario inline solo para esa fila (precio + fecha + Guardar/Cancelar);
  el resto de las filas se mantienen compactas.

Editar → `PUT /api/products/[id]` (`price`, `availableFrom`). Eliminar →
`DELETE /api/products/[id]` (hard delete — no hay `PreOrder` ni inventario
real asociado a estos productos).

## Por qué NO aparecen en `/admin/productos` ni `/admin/stock`

- `/admin/productos`: `renderAdminProductsFiltered` filtra `isPreorder`
- `/admin/stock`: `renderStockList` — mismo filtro, agregado 2026-08-29
  (antes faltaba)

## Diferencias con otros flujos de preventa

| | `/admin/preventa` (este) | `/admin/ops/preventas` |
|---|---|---|
| Qué crea | `Product` (`isPreorder: true`) | `PreOrder` |
| Uso | Publicar en el catálogo online | Registrar venta local/presencial |
| Contabilidad | No aplica | Registra asiento INGRESO |

## Endpoints relevantes

- `GET /api/admin/precios` — Lista de Precios, origen de los dispositivos
  del grid y de `preventaARS` (precio sugerido)
- `POST /api/admin/preorders/bulk` — crea/actualiza variantes (un item por
  color en el body)
- `GET /api/products?preorder=true&limit=100` — listar lo publicado
- `PUT /api/products/[id]` / `DELETE /api/products/[id]` — editar/eliminar
  una variante puntual

## Limitaciones conocidas

- El precio sugerido al agregar un color es el mismo para todos los colores
  de esa carga (se puede editar por color en el modal antes de agregar, o
  después desde "Preventas activas", pero no hay autocompletado por
  almacenamiento como si tiene el wizard legacy de `public/lib/preventa.js`
  — ese wizard sigue existiendo en el código pero no está enrutado a
  ninguna página).
- Eliminar es de a una variante por vez; no hay "eliminar solo este color en
  todos los almacenamientos" de un click.
