# Plan de Mejoras UX/Design — Great Phones

**Fecha:** Mayo 2026
**Rama:** dev

---

## ALTA PRIORIDAD

### 1. Accesibilidad basica
- [x] Focus visible (`:focus-visible` en globals.css)
- [x] Escape key para cerrar carrito, modales, dropdown busqueda
- [x] ARIA labels en botones de icono (carrito, favoritos, notificaciones)
- [x] Contraste: oscurecer `--gray` de `#8A8078` a `#6B6259`

### 2. Estados vacios mejorados
- [x] Carrito vacio: ilustracion SVG, productos populares, trust signals
- [x] Sin resultados de busqueda: template con ilustracion, sugerencias, atajos
- [x] Favoritos vacios: consolidar duplicados, productos recomendados

### 3. Loading states (skeletons)
- [x] Skeleton cards: 8 placeholders con animacion pulse
- [x] Imagenes: `loading="lazy"`, placeholder gris, `onerror` fallback
- [x] Indicador global: barra de progreso sutil en top para API calls

### 4. Busqueda mejorada
- [ ] Debounce 200ms
- [ ] Buscar en `sub`, `descripcion`, `categoria` (no solo nombre/marca)
- [ ] Navegacion por teclado (flechas, Enter, Escape)
- [ ] Busquedas recientes (ultimas 5 en localStorage)

### 5. Galeria de producto (detail page)
- [x] Swipe mobile (touchstart/touchmove) - hover zoom 1.8x + lightbox
- [x] Contador "1 / 4" debajo de imagen principal - lightbox con click
- [x] Conectar lightbox existente a imagenes del detail

### 6. Panel de notificaciones
- [x] Boton "Limpiar" para eliminar todas las notificaciones
- [x] Boton "Marcar leidas" mejorado (mas visible)
- [x] API endpoint `/api/notifications/clear-all`

---

## MEDIA PRIORIDAD

### 7. Carrito UX
- [ ] Limite de stock (no agregar mas de lo disponible)
- [ ] Undo al eliminar (toast "Producto eliminado — Deshacer" 5s)
- [ ] Sync entre tabs (`window.addEventListener('storage', ...)`)
- [ ] Animacion cantidad (breve scale al cambiar +/-)

### 8. Checkout: progress indicator
- [ ] Stepper visual: Carrito > Datos > Pago > Confirmacion

### 9. Trust signals en checkout
- [ ] Logos Visa, Mastercard, Mercado Pago
- [ ] Badge "Compra segura" con candado
- [ ] Link politica de devolucion cerca del boton de pagar

### 10. Back to top + scroll progress
- [ ] Boton flotante (aparece a 600px scroll)
- [ ] Barra de progreso naranja en el tope

### 11. Admin: busqueda y paginacion
- [ ] Input busqueda productos por nombre/SKU
- [ ] Paginacion (20 items/pagina)
- [ ] Exportar CSV

---

## BAJA PRIORIDAD

- [ ] Breadcrumbs en todas las paginas
- [ ] Productos relacionados en detail (4 cross-sell)
- [ ] Toast system mejorado (stack, tipos, dismiss)
- [ ] Share en producto (WhatsApp/Instagram)
- [ ] Newsletter en footer
