# Preventas Online - Documentación

> **Actualizado 2026-08-29.** Esta es la segunda reescritura de este documento.
> La primera versión describía un componente React (`PreventaOnlineClient.tsx`)
> que terminó siendo una reimplementación peor de algo que ya existía. Se
> eliminó ese componente y `/admin/preventa` vuelve a usar el panel admin
> legacy (`public/lib/preventa.js`), que es más completo. Este documento
> describe el sistema real, tal como quedó.

## ¿Qué son las Preventas Online?

Productos que aparecen en el catálogo público sin stock real, con una fecha
de entrega estimada. El cliente los "reserva" en vez de comprarlos. Cada
color/almacenamiento de un mismo dispositivo es un `Product` real
(`isPreorder: true`, `stock: 0`) — no hay ninguna tabla ni JSON especial para
las variantes, es el mismo mecanismo (`modelGroup`) que ya usa el resto del
catálogo para productos con variantes de color.

## Dónde vive esto

`/admin/preventa` sirve el **panel admin legacy** (el mismo sistema que
`/admin/stock`, `/admin/productos`, etc.: `serveAdminSpa` + `AdminPageClient`,
HTML inyectado y controlado por scripts vanilla JS en `public/lib/`). La
lógica específica de preventas está en **`public/lib/preventa.js`**.

Al entrar a `/admin/preventa`, `admin.js` dispara `renderPreventaTab('catalogo')`,
que muestra 3 sub-pestañas:

1. **Catálogo Preventa** — administrar qué productos de preventa están
   publicados (crear, editar, eliminar). Es el tema de este documento.
2. **Preventas Online** — pedidos que los clientes ya hicieron reservando
   estos productos (`PreOrder` records, `source: 'online'`). No confundir
   con la pestaña anterior: acá se ven reservas de clientes, no se cargan
   productos.
3. **Historial** — preventas registradas a mano (venta local/presencial),
   comparte el mismo modelo `PreOrder` que usa `/admin/ops/preventas`.

## Flujo: crear/editar un producto de preventa (pestaña "Catálogo Preventa")

Botón **"+ Nueva Preventa"** abre un wizard de 3 pasos (`openPreventaForm` →
`renderPrevWizardStep`):

### Paso 1 — Datos del modelo
- **Marca**: dropdown real (`getUniqueBrands()` — Apple, Samsung, MacBook,
  iPad, Motorola, Xiaomi, Google), no texto libre.
- **Tipo**: celular / tablet / laptop / smartwatch.
- **Modelo**: dropdown poblado desde `SELL_MODELS[brand]` (o `SELL_MODELS['iPhone']`
  si la marca es Apple), definido en `public/lib/constants.js`.
- **Condición**, **Descripción** (opcional).

### Paso 2 — Combinaciones (la matriz color × almacenamiento)
Al elegir el modelo, `buildPrevMatrixRows()` genera automáticamente **una
fila por cada combinación de color × almacenamiento** de ese modelo, usando
`MODEL_COLORS[model]` y `MODEL_STORAGES[model]` (constantes curadas en
`constants.js` — para iPhones, storages reales según generación: p. ej.
"iPhone 12 Pro Max" → `['128 GB','256 GB','512 GB']`).

Para cada fila, se autocompleta el **precio según el almacenamiento**
consultando Lista de Precios: `cargarPreciosLista()` trae
`/api/admin/precios` + `/api/admin/precios/macipad`, y
`buscarPrecioLista(modelo, almacenamiento)` busca la fila exacta
(modelo + almacenamiento) y usa su `preventaARS`. Esto es exactamente lo
que hace que "128 GB" y "256 GB" del mismo modelo tengan precios distintos
tomados de Lista de Precios.

Cada fila se puede:
- Activar/desactivar (✓ verde) — las desactivadas no se publican
- Cambiar de color (círculo de color → abre selector)
- Editar precio y fecha de disponibilidad manualmente
- Subir una imagen propia (si no, usa la imagen general del modelo)
- Eliminar (✕)

### Paso 3 — Revisar y guardar
Resumen de marca/modelo/condición y de cada combinación activa (color,
almacenamiento, precio, fecha). Botón **"✓ Guardar preventa"** dispara
`savePreventaProduct()`.

## Qué pasa al guardar (`savePreventaProduct`)

Por cada fila activa se hace un `POST /api/products` (o `PUT
/api/products?id=X` para la primera fila si se está editando un grupo
existente):

```js
{
  name: model,            // "iPhone 12 Pro Max"
  modelGroup: model,      // MISMO valor que name — legible, no un slug
  brand: brand,           // "Apple" (real, del dropdown)
  type: type,
  condition: cond,
  storage: storage,       // "128 GB" — campo real, no solo dentro de `sub`
  color: color,            // "Silver"
  price: parseInt(r.price),
  cost: 0,
  stock: 0,
  availableFrom: r.availableFrom + 'T00:00:00.000Z',
  imageUrl: r.imageUrl || img,
  images: [...],
  sub: `${color} · ${storage}`,
  isPreorder: true,
  ico: '📱',
}
```

Todas las filas de un mismo modelo comparten `modelGroup` (el nombre del
modelo, legible). Es el mismo campo que usa `/detail/[id]` para juntar
variantes hermanas y que usa `products/route.ts` (`progroupMin`/
`progroupCount`) para calcular el "Desde $X, N variantes" en las cards del
catálogo.

## Cómo se ven en el catálogo público

- **Grilla** (`renderShopGrid` en `render.js`): agrupa por `modelGroup`,
  muestra la variante más barata, badge de días hasta disponibilidad
  (`preorderCountdown`) y botón "Agregar al carrito" (que en realidad
  reserva). Marca se normaliza a "APPLE" vía `preorderBrand()`.
- **Detalle** (`/detail/[id]`): busca todos los `Product` con el mismo
  `modelGroup`, arma círculos de color y — para el color elegido — chips de
  almacenamiento disponibles (`renderDetailVariants`, rama
  `window._isPreorderDetail`). Selecciona automáticamente la variante que
  matchea color+almacenamiento elegidos.

## Administrar lo publicado (pestaña "Catálogo Preventa")

`loadPreventaProducts()` trae `GET /api/products?preorder=true&limit=200`
(este filtro aplica siempre, sea o no admin) y muestra una card compacta por
`Product` — no agrupada por modelo, cada color/almacenamiento es su propia
card (`prevCatalogCardHtml`): imagen, nombre, `storage color · condición`,
fecha de disponibilidad, precio, y **exactamente dos botones**:

- **✏ Editar** (`editPreventaProduct(id)`) — trae el producto
  (`GET /api/products/[id]`) y reabre el wizard con `openPreventaForm(p)`,
  precargando **todas** las variantes del mismo `modelGroup` para editarlas
  juntas.
- **🗑 Eliminar** (`deletePreventaProduct(id)`) — `DELETE
  /api/products?id=X`, que hace **soft-delete** (marca `deletedAt` y
  `isPreorder: false`) vía el sistema de auditoría normal de productos, no
  un hard-delete.

Hay chips de marca arriba de la grilla para filtrar, y un buscador que
matchea por modelo/color/almacenamiento.

## Por qué NO aparecen en `/admin/productos` ni `/admin/stock`

- `/admin/productos` (`renderAdminProductsFiltered` en `render.js`): filtra
  `if(p.isPreorder)return false;`
- `/admin/stock` (`renderStockList` en `render.js`): mismo filtro, agregado
  el 2026-08-29 (antes faltaba y las preventas sí aparecían ahí — bug ya
  corregido).

La única vista de administración donde se ven es "Catálogo Preventa" dentro
de `/admin/preventa`.

## Diferencias: Preventa Online vs Registra Preventa vs Preventas Online (pedidos)

| Aspecto | Catálogo Preventa (`/admin/preventa`) | Registra Preventa (`/admin/ops/preventas`) | Preventas Online — pedidos (sub-tab dentro de `/admin/preventa`) |
|---|---|---|---|
| Qué administra | Productos publicados en el catálogo | Ventas locales/presenciales registradas a mano | Pedidos que clientes ya hicieron reservando productos del catálogo |
| Qué crea/edita | `Product` (`isPreorder: true`) | `PreOrder` | Lee `PreOrder` (`source: 'online'`), no crea |
| Contabilidad | No aplica | Registra asiento INGRESO | No aplica directamente |

## Endpoints relevantes

- `GET /api/admin/precios` + `GET /api/admin/precios/macipad` — Lista de
  Precios, fuente del autocompletado de precio por almacenamiento
- `POST /api/products` / `PUT /api/products?id=X` — crear/editar cada
  variante (color × almacenamiento) del wizard
- `GET /api/products?preorder=true&limit=200` — listar lo publicado (usa
  este filtro sin importar si el caller es admin)
- `DELETE /api/products?id=X` — soft-delete de una variante puntual
- `GET /api/products/[id]` / `PUT /api/products/[id]` — usados por
  `editPreventaProduct` para traer y (parcialmente) actualizar un producto

## Notas / limitaciones conocidas

- El wizard genera la matriz de color×almacenamiento desde constantes
  curadas a mano (`MODEL_COLORS`/`MODEL_STORAGES` en `constants.js`), no
  desde Lista de Precios directamente — si un modelo no está en esas
  constantes, no aparece en el dropdown del wizard.
- `deletePreventaProduct` borra una variante a la vez (un color +
  almacenamiento), no el grupo completo de un click — para borrar un modelo
  entero hay que eliminar cada card.
