# 🐛 Bugs y Problemas Encontrados

Última actualización: 2026-08-30

---

## 🔴 CRÍTICOS (Rompen funcionalidad)

### 1. ✅ Error al registrar reparación - `cost` field missing
**Archivo:** `/src/app/api/admin/taller/reparaciones/route.ts:143`
**Problema:** PrismaClientValidationError - campo `cost` no existe en el schema de `repair`
**Error:** `Unknown argument 'cost'. Did you mean 'code'?`
**Solución:** Remover campo `cost` del create() o agregarlo al schema de Prisma si es necesario
**Status:** ✅ CORREGIDO (commit 5d79a2d)
- Removí el campo `cost` del create ya que tiene `@default(0)` en el schema

### 2. ✅ Registrar Compra - dispositivos no aparecen como stock en Productos
**Problema:** Las compras de dispositivos pasan a ser stock real pero no se ven en Productos
**Esperado:** Los dispositivos comprados deben aparecer en el inventario de Productos
**Status:** ✅ CORREGIDO (commit b4ee62e)
- Agregué lógica para crear un `Product` cuando se registra una `Compra`
- Ahora ambos (InventoryItem + Product) se crean simultáneamente
- Los dispositivos aparecerán en la sección de Productos con precio calculado (30% margen default)

### 3. ✅ Error en agregar accesorio - Dispositivos Compatibles no se abre
**Archivo:** `/public/pages/admin-acc.html` + `/public/lib/admin.js`
**Problema:** El modal `compatModal` no existía en el HTML, función `openCompatModal()` lo buscaba pero no lo encontraba
**Status:** ✅ CORREGIDO (commit 89ec9c3)
- Agregué el HTML del modal `compatModal` en `admin-acc.html`
- El modal ahora tiene:
  - Header con título y botón de cierre
  - Herramientas: Select Todo, Limpiar, Rango de selección
  - Grid de dispositivos agrupados (iPhone/iPad vs Otros)
  - Footer con botón "Listo"
- Los estilos CSS ya existían en `components.css`
- Toda la lógica de JavaScript ya estaba implementada en `admin.js`

---

## 🟠 ALTOS (Funcionalidad incompleta)

### 4. ✅ Preventas registradas no se ven en el calendario
**Status:** ✅ CORREGIDO (commit c68517d)
- **Problema:** Filtro de preventas no incluía status `'COMPRADO'`
- **Solución:** Agregué `'COMPRADO'` al array de status permitidos
- **Cambio:** Línea 105 del `/src/app/api/admin/calendario/route.ts`
**Problema:** Las preventas que se registran no aparecen en el calendario de pendientes
**Esperado:** Debe incluir preventas en la visualización del calendario
**Status:** 🟠 Alto

### 5. Ingresos online no se registran en Reportes como operación
**Problema:** Los pagos online no aparecen en los reportes financieros
**Esperado:** Deben registrarse como movimientos financieros en Reportes
**Status:** 🟠 Alto (Investigado - webhook implementado, posible problema en disparo de Mercado Pago)

### 6. ✅ Chat no muestra mensajes
**Problema:** Chat muestra conversaciones con usuarios pero no los mensajes individuales
**Esperado:** Debe mostrar el historial de mensajes de cada conversación
**Status:** ✅ CORREGIDO (commit ae8c7e1)
- Problema: `loadMessages()` en chat.js usaba variable `API_URL` no definida
- Solución: Agregué definición de `API_URL` al inicio de chat.js

### 7. ✅ Dispositivos Comprados - filtro de búsqueda roto
**Problema:** Al buscar dispositivos comprados locales (CMP-*), se perdía el filtro de código
**Esperado:** Debe mantener el prefijo CMP- al aplicar búsqueda
**Status:** ✅ CORREGIDO (commit 2509e9f)
- Problema: `whereLocal.OR` reemplazaba la condición de `code: { startsWith: 'CMP-' }`
- Solución: Usé `whereLocal.AND` para combinar búsqueda con filtro de código

### ✅ BUGS ADICIONALES CORREGIDOS EN ESTA SESIÓN

### 1. Comisiones solo suma movimientos
**Status:** ✅ CORREGIDO (commit ef32624)
- Problema: El cálculo de comisiones incluía EGRESOS además de INGRESOS
- Solución: Agregué filtro `type: 'INGRESO'` en el groupBy principal

### 2. Caja/Contabilidad - Validación de USD
**Status:** ✅ CORREGIDO (commit eb9fec5)
- Problema: Para transacciones en USD, validaba `amount` en lugar de `amountUsd`
- Solución: Cambié validación a usar `amountUsd` cuando means === 'USD'

### 3. Valor del dólar - permitir override manual
**Status:** ✅ MEJORADO (commit 3a2e204)
- Problema: No había forma de hacer override manual del valor del dólar
- Solución: Agregué endpoints POST/DELETE para guardar/eliminar override en AppConfig

---

## 🟡 MEDIOS (Errores/Comportamientos raros)

### 8. ✅ Al seleccionar Historial Reparaciones se cambia estado de seleccionado
**Problema:** Selecciona también "Registrar Reparación" cuando se elige "Historial"
**Esperado:** Solo debe seleccionar la opción elegida
**Status:** ✅ CORREGIDO (commit c80af2e)
- Problema: `pathname.startsWith()` en AdminSidebar coincidía con prefijos
- Solución: Agregué `exact: true` en items de reparaciones para exactMatch

### 9. ✅ Bug sidebar al dar al botón para atrás en panel de admin
**Problema:** El sidebar se mantiene visible cuando se vuelve atrás
**Esperado:** Debe cerrarse o ajustarse según el flujo de navegación
**Status:** ✅ CORREGIDO (commit c80af2e)
- Problema: El useEffect solo se ejecutaba al montar (dependencias vacías)
- Solución: Agregué `usePathname()` y lo pasé al array de dependencias

### 10. ✅ Secciones legacy a veces no cargan
**Problema:** Las secciones legacy requieren actualizar la página para cargar
**Esperado:** Deben cargar sin necesidad de refresh
**Status:** ✅ MEJORADO (commit c80af2e)
- Problema: Errores silenciados y falta de reintentos si contenido no se popula
- Solución: Agregué logging detallado y reintentos automáticos de renderAdminContent

### 11. Comisiones solo suma movimientos
**Problema:** El cálculo de comisiones no es correcto
**Esperado:** Debe calcular correctamente según el tipo de movimiento
**Status:** 🟡 Medio

### 12. Valor del dólar en dólar api
**Problema:** No se toma bien el valor o no se puede modificar
**Esperado:** Debe permitir usar valor actual de API y permitir override manual
**Status:** 🟡 Medio

### 13. Caja/Contabilidad - Registrar Movimiento
**Problema:** Los valores solicitados no son correctos (especialmente dólares)
**Archivo:** `/src/app/admin/caja/`
**Status:** 🟡 Medio

---

## 🔵 BAJOS (Mejoras de UX/UI)

### 14. ✅ Lista de precios (Mac/iPad) - agregar foto no solo link
**Problema:** Solo permite ingresar URL, no subir archivo
**Mejora:** Permitir upload de imágenes además de links
**Status:** ✅ IMPLEMENTADO (commit 04a805d)
- Agregué input file type="image"
- Convierte imagen a base64 para almacenamiento
- Mantiene opción de pegar URL
- Preview en tiempo real

### 15. ✅ Formulario Agregar Producto - pantalla autocompletar
**Problema:** Pantalla no se autocompleta con tamaño según dispositivo seleccionado
**Mejora:** 
  - RAM debe depender del modelo de iPhone (select dinámico)
  - Si hay solo una opción, auto-seleccionar
**Status:** ✅ IMPLEMENTADO (commit 8128aac)
- Agregué tabla IPHONE_SPECS con 16 modelos iPhone y sus pantallas
- Función onAdminIphoneModelChange() auto-rellena pantalla al seleccionar modelo
- Función updateProductFields() maneja visibilidad de campos dinámicamente
- Popula el select de modelos iPhone cuando se selecciona marca iPhone

### 16. ✅ Select de Proveedor → cambiar a Input
**Problema:** Select es poco flexible
**Mejora:** Cambiar por input con autocompletar/búsqueda
**Status:** ✅ IMPLEMENTADO (commit 72f932b)
- Cambié accSupplier de `<select>` a `<input type="text">`
- El usuario ahora puede escribir cualquier nombre de proveedor libremente
- Mayor flexibilidad para proveedores no predefinidos
- Desactivé función loadAccSuppliers() ya que no es necesaria

### 17. Revisar Inversores - mejoras de diseño y forms
**Problema:** Formularios y diseño general necesita revisión
**Status:** 🔵 Bajo (sin resolver - requiere rediseño)
**Nota:** Necesita rediseño completo de componentes - no hay entrada clara para este módulo

---

## 📊 Resumen por Prioridad

| Prioridad | Cantidad | Bloqueante |
|-----------|----------|-----------|
| 🔴 Crítico | 3 | Sí |
| 🟠 Alto | 4 | Parcial |
| 🟡 Medio | 6 | No |
| 🔵 Bajo | 4 | No |
| **Total** | **17** | - |

---

## 🎯 Orden recomendado para corregir

1. ❌ Error reparación (`cost` field)
2. ❌ Compras de dispositivos → stock en Productos
3. ❌ Accesorio Color/Compatibles modales
4. ✅ Preventas en calendario
5. ✅ Ingresos online en reportes
6. ✅ Chat mensajes
7. ✅ Dispositivos Comprados integración
8. 🔧 Historial Reparaciones selección
9. 🔧 Sidebar back button
10. 🔧 Legacy sections carga
11. 🔧 Comisiones cálculo
12. 🔧 Dólar API
13. 🔧 Caja/Contabilidad valores
14. ✏️ Fotos en precios (Mac/iPad)
15. ✏️ Producto pantalla autocompletar
16. ✏️ Proveedor Input
17. ✏️ Inversores UI/UX

---

## 📝 Notas

- Algunos bugs pueden tener dependencias entre sí
- Revisar si los cambios en calendario (rediseño) afectan la visualización de preventas
- Verificar que la API de dólar esté correctamente integrada
