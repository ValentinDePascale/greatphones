# Great Phones — Production Readiness Audit

**Date:** May 16, 2026
**Version:** 0.1.0 (alpha)

---

## FUNCIONALIDADES COMPLETAS

- Catalogo de productos (CRUD, filtrado, busqueda)
- Carrito de compras (localStorage)
- Checkout con Mercado Pago (preferencia, webhook, confirmacion)
- Autenticacion (email/password, Google OAuth, verificacion por email)
- Chat en tiempo real (Socket.IO, paneles, badges)
- Panel de admin (productos, accesorios, pedidos, arrepentimientos)
- Arrepentimiento (ley 24.240, flujo completo)
- Notificaciones (DB, polling, panel, badges)
- Emails (ordenes, chat, arrepentimientos)
- Envios (Andreani, costos por zona)
- Responsive design (mobile/tablet/desktop)

---

## CRITICOS (OBLIGATORIOS ANTES DE LANZAR)

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **Credenciales de Mercado Pago son placeholder** (`TEST-tu-access-token`) | No se pueden cobrar pagos reales |
| 2 | **Credenciales de Google OAuth son placeholder** | Login con Google no funciona |
| 3 | **Admin hardcoded** (`admin@greatphones.com` / `123456`) en signin route | Cualquiera puede ser admin |
| 4 | **Sin autenticacion en rutas admin** | Cualquiera puede borrar productos/ordenes |
| 5 | **CORS `*` en todas las rutas API** | Ataque cross-origin |
| 6 | **Codigo de verificacion se expone en la respuesta API** | Robo de cuentas |
| 7 | **Race condition en checkout** | Dos usuarios pueden comprar el ultimo item |
| 8 | **Webhook de MP sin verificacion de firma** | Cualquiera puede spoofear pagos |
| 9 | **`.env` con secretos expuestos** | Base de datos, Cloudinary, Gmail comprometidos |

---

## PARCIALMENTE IMPLEMENTADOS (necesitan backend)

| Feature | Estado |
|---------|--------|
| **Reparaciones** | Formulario existe, NO hay API routes |
| **Ventas de equipos** (Sell) | Quotes se crean pero sin motor de precios |
| **Garantias** | Formulario existe, NO hay API routes |
| **Favoritos** | Solo localStorage, no se sincronizan a la BD |
| **Wallet** | Modelo existe, NO hay API |
| **Comparador de modelos** | Solo frontend |
| **Configurador de notebooks** | Solo frontend |
| **Precios mayoristas** | Sin logica |

---

## FALTAN COMPLETAMENTE

- Tests (unitarios, integracion, E2E)
- Rate limiting en cualquier endpoint
- Reset de password
- Pagina de tracking de pedidos
- Reviews/ratings de productos
- Generacion de facturas (AFIP)
- Data Fiscal real (hoy es SVG estatico)
- Sitemap.xml / robots.txt
- Meta tags SEO / Open Graph
- Pagina 404 custom
- Notificaciones push (web)
- Sistema de gift cards (mencionado en UI, sin backend)

---

## PLAN DE ACCION PRIORIZADO

### Semana 1 — Seguridad y Pagos (bloqueantes)

1. Rotar TODOS los secretos expuestos
2. Poner credenciales reales de Mercado Pago
3. Eliminar admin hardcoded + agregar middleware de auth en rutas admin
4. Verificar firma de webhook de MP
5. Fix race condition en checkout (reservar stock atomicamente)
6. Quitar codigo de verificacion de la respuesta API

### Semana 2 — Funcionalidad basica

7. Agregar rate limiting (auth, email, uploads)
8. Completar API de reparaciones y garantias
9. Sincronizar favoritos a la BD
10. Agregar pagina de tracking de pedidos
11. Reset de password

### Semana 3 — Produccion

12. SEO basico (meta tags, sitemap, robots.txt)
13. Pagina 404
14. Tests minimos del checkout
15. Configurar CI/CD
16. Variables de entorno en Render

---

## RESUMEN

| Categoria | Cantidad |
|-----------|----------|
| Funcionalidades completas | ~35 |
| Parcialmente implementadas | ~30 |
| Faltan completamente | ~33 |
| Issues criticos | 9 |
| Recomendaciones de mejora | ~56 |

**Veredicto: NO PRODUCTION READY**

Los 9 items criticos de seguridad y pagos son **bloqueantes absolutos**. Sin credenciales reales de Mercado Pago y sin proteger las rutas admin, no se puede lanzar.
