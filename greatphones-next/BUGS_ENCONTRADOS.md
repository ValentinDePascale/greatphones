# 🐛 Bugs y Problemas Encontrados

Última actualización: 2026-08-30

---

## 🔴 CRÍTICOS (Rompen funcionalidad)

### 1. Error al registrar reparación - `cost` field missing
**Archivo:** `/src/app/api/admin/taller/reparaciones/route.ts:143`
**Problema:** PrismaClientValidationError - campo `cost` no existe en el schema de `repair`
**Error:** `Unknown argument 'cost'. Did you mean 'code'?`
**Solución:** Remover campo `cost` del create() o agregarlo al schema de Prisma si es necesario
**Status:** 🔴 Bloqueante

### 2. Registrar Compra - dispositivos no aparecen como stock en Productos
**Problema:** Las compras de dispositivos pasan a ser stock real pero no se ven en Productos
**Esperado:** Los dispositivos comprados deben aparecer en el inventario de Productos
**Status:** 🔴 Bloqueante

### 3. Error en agregar accesorio - Elegir Color y Dispositivos Compatibles no se abren
**Archivo:** `/src/app/admin/productos/accesorios/`
**Problema:** Los selects/modales no se abren en la pantalla de admin (solo funcionan en home)
**Status:** 🔴 Bloqueante

---

## 🟠 ALTOS (Funcionalidad incompleta)

### 4. Preventas registradas no se ven en el calendario
**Problema:** Las preventas que se registran no aparecen en el calendario de pendientes
**Esperado:** Debe incluir preventas en la visualización del calendario
**Status:** 🟠 Alto

### 5. Ingresos online no se registran en Reportes como operación
**Problema:** Los pagos online no aparecen en los reportes financieros
**Esperado:** Deben registrarse como movimientos financieros en Reportes
**Status:** 🟠 Alto

### 6. Chat no muestra mensajes
**Problema:** Chat muestra conversaciones con usuarios pero no los mensajes individuales
**Esperado:** Debe mostrar el historial de mensajes de cada conversación
**Status:** 🟠 Alto

### 7. Dispositivos Comprados no muestra compras registradas
**Problema:** No aparecen dispositivos de "Registrar Compra" ni los aceptados en "Cotizaciones"
**Esperado:** Debe integrar ambas fuentes de datos
**Status:** 🟠 Alto

---

## 🟡 MEDIOS (Errores/Comportamientos raros)

### 8. Al seleccionar Historial Reparaciones se cambia estado de seleccionado
**Problema:** Selecciona también "Registrar Reparación" cuando se elige "Historial"
**Esperado:** Solo debe seleccionar la opción elegida
**Status:** 🟡 Medio

### 9. Bug sidebar al dar al botón para atrás en panel de admin
**Problema:** El sidebar se mantiene visible cuando se vuelve atrás
**Esperado:** Debe cerrarse o ajustarse según el flujo de navegación
**Status:** 🟡 Medio

### 10. Secciones legacy a veces no cargan
**Problema:** Las secciones legacy requieren actualizar la página para cargar
**Esperado:** Deben cargar sin necesidad de refresh
**Status:** 🟡 Medio

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

### 14. Lista de precios (Mac/iPad) - agregar foto no solo link
**Problema:** Solo permite ingresar URL, no subir archivo
**Mejora:** Permitir upload de imágenes además de links
**Status:** 🔵 Bajo

### 15. Formulario Agregar Producto - pantalla autocompletar
**Problema:** Pantalla no se autocompleta con tamaño según dispositivo seleccionado
**Mejora:** 
  - RAM debe depender del modelo de iPhone (select dinámico)
  - Si hay solo una opción, auto-seleccionar
**Status:** 🔵 Bajo

### 16. Select de Proveedor → cambiar a Input
**Problema:** Select es poco flexible
**Mejora:** Cambiar por input con autocompletar/búsqueda
**Status:** 🔵 Bajo

### 17. Revisar Inversores - mejoras de diseño y forms
**Problema:** Formularios y diseño general necesita revisión
**Status:** 🔵 Bajo

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
