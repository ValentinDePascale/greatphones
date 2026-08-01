# PLAN.md — Items pendientes de mejora (post-launch)

## 1. `catch (error: any)` → `catch (error)` (13 instancias, ~30 min)

| Archivo | Línea | Nota |
|---------|-------|------|
| `checkout/route.ts` | 471 | Tiene `if (error.status)` — hacer type narrowing |
| `wallet/pay/route.ts` | 190 | Tiene `if (error.status)` |
| `favorites/route.ts` | 60 | Chequea `error.code === 'P2002'` |
| `products/route.ts` | 136, 192, 243 | 3 instancias con special logic |
| `shipping/enviopack/crear/route.ts` | 123 | Generic |
| `shipping/enviopack/route.ts` | 131 | Generic |
| `shipping/andreani/route.ts` | 107 | Generic |
| `giftcard/preference/route.ts` | 107 | Generic |
| `admin/sales-history/route.ts` | 115 | Generic |
| `giftcard/redeem/route.ts` | 90 | Generic |
| `coupons/route.ts` | 32 | Generic |

**Cambio**: Quitar `: any`, agregar type narrowing (`instanceof Error`, `typeof error === 'object'`) donde se acceda a properties.

---

## 2. `as any` en enums de Prisma (12 instancias en prod, ~20 min)

| Archivo | Línea | Actual | Reemplazar por |
|---------|-------|--------|---------------|
| `webhooks/mercadopago/route.ts` | 120 | `status: newStatus as any` | `status: newStatus as OrderStatus` |
| `webhooks/mercadopago/route.ts` | 211 | `status: orderStatus as any` | `status: orderStatus as OrderStatus` |
| `webhooks/mercadopago/route.ts` | 281 | `order.status = 'SHIPPED' as any` | `order.status = OrderStatus.SHIPPED` |
| `giftcard/preference/route.ts` | 71 | `} as any` | Usar tipo `Prisma.GiftCardCreateInput` |
| `warranty/preference/route.ts` | 86 | `} as any` | Usar tipo `Prisma.WarrantyExtendCreateInput` |
| `warranty/confirm/route.ts` | 37 | `(paymentData as any)?.status` | `paymentData.status` con tipo de MP SDK |
| `upload/route.ts` | 51-52 | `(uploadResult as any)` | `uploadResult` con `v2.UploadApiResponse` |
| `arrepentimiento/route.ts` | 176 | `await mpRes.json() as any` | Definir interfaz `MPRefundResponse` |

---

## 3. Rate limiting coverage (5 endpoints, ~30 min)

Agregar `rateLimit()` a estos endpoints públicos que hacen queries a DB:

| Endpoint | Límite sugerido |
|----------|-----------------|
| `GET /api/products` (con filtros pesados) | 30/min por IP |
| `GET /api/accessories` (con filtros) | 30/min por IP |
| `POST /api/conversations` (crear) | 5/min por usuario |
| `POST /api/giftcard/preference` | 5/min por usuario |
| `POST /api/warranty/preference` | 5/min por usuario |

---

## 4. CSP hardening (~15 min)

- Agregar `report-uri` o `report-to` en `next.config.ts` para recibir reportes de violación CSP
- Evaluar quitar `'unsafe-inline'` migrando inline handlers a archivos JS (tarea grande, requiere refactor del SPA)

---

## 5. Migración de SPA a Next.js nativo (gran esfuerzo, beneficio a largo plazo)

El SPA (`public/index.html` + `public/lib/*.js`) limita:
- SSR para SEO
- `next/image` optimization
- Component-based architecture
- Error boundaries nativos
- Type safety en todo el frontend

**Estrategia**: Migrar progresivamente página por página, manteniendo el SPA como legacy.

---

## 6. Database backup automation (ya documentado en PRODUCCION.md)

Crear `.github/workflows/db-backup.yml` basado en el ejemplo de PRODUCCION.md (línea 54-72).

---

## Orden de prioridad

1. Items 1 y 2 (type safety) — sin riesgo, mecánicos
2. Item 3 (rate limiting) — seguridad, bajo esfuerzo
3. Item 6 (DB backup) — operaciones
4. Item 4 (CSP) — hardening
5. Item 5 (SPA migration) — largo plazo
