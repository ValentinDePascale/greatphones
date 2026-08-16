import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CheckoutSchema, formatZodError } from '@/lib/validations';
import { sendOrderConfirmationEmail, sendNewOrderAdminNotification } from '@/lib/email';
import { productCache } from '@/lib/cache';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { reserveStock } from '@/lib/stock';
import { getEffectivePrice, generateOrderCode, WARRANTY_COST_MAP } from '@/lib/pricing';
import { RESERVATION_TTL_MINUTES } from '@/config';
import { AuthError } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

async function findOrCreateUser(email: string, phone?: string, document?: string) {
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    // Crea el user sin password y verified=false para evitar account squatting:
    // - No puede hacer login (signin chequea user.verified)
    // - Después de pago confirmado vía webhook, se le envía magic link para setear password
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        phone: phone || null,
        dni: document || null,
        verified: false,
      }
    });
  }
  return user;
}

async function releaseStaleReservations() {
  const staleSince = new Date(Date.now() - RESERVATION_TTL_MINUTES * 60 * 1000);
  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: staleSince },
    },
    include: { items: true },
    take: 20,
  });

  for (const order of staleOrders) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              reserved: { decrement: item.quantity },
            },
          });
        }
        if (item.accessoryId) {
          await tx.accessory.update({
            where: { id: item.accessoryId },
            data: {
              stock: { increment: item.quantity },
              reserved: { decrement: item.quantity },
            },
          });
        }
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
      console.log('[Checkout] Released stale reservation for order:', order.code);
    }).catch(err => {
      console.error('[Checkout] Error releasing stale order:', order.code, err.message);
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Release stale PENDING reservations before processing new checkout
    releaseStaleReservations().catch(err => console.error('[Checkout] Error in releaseStaleReservations:', err));

    const body = await request.json();
    const validation = CheckoutSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Checkout] Validation failed');
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const ip = clientIpKey(request)
    const checkoutLimit = await rateLimit(`checkout:${ip}`, 10, 300000)
    if (!checkoutLimit.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera 5 minutos.' }, { status: 429 })
    }

    const { 
      items, email, phone, street, number, floor, zip, city, province, document,
      warranty, delivery, cuotas, carrier, carrierService, paymentMethod,
      coupons: couponIds, agreedToTerms,
    } = validation.data as any;

    const hasPreorderItems = items.some((item: any) => item.isPreorder);
    if (hasPreorderItems && !agreedToTerms) {
      return NextResponse.json({ error: 'Debe aceptar los términos y condiciones de preventa' }, { status: 400 });
    }
    const user = await findOrCreateUser(email, phone, document);
    const userId = user.id;

    const orderCode = generateOrderCode();

    // Split items into product and accessory items
    const productItems = items.filter((item: any) => item.type !== 'accesorio');
    const accessoryItems = items.filter((item: any) => item.type === 'accesorio');

    // Fetch products from DB
    const productMap = new Map();
    if (productItems.length > 0) {
      const productIds = productItems.map((item: any) => item.id);
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      for (const p of products) productMap.set(p.id, p);
    }

    // Fetch accessories from DB
    const accessoryMap = new Map();
    if (accessoryItems.length > 0) {
      const accessoryIds = accessoryItems.map((item: any) => item.id);
      const accessories = await prisma.accessory.findMany({ where: { id: { in: accessoryIds } } });
      for (const a of accessories) accessoryMap.set(a.id, a);
    }

    // Validate IMEI items (specific inventory units) — skip for preorder items
    const imeiMap = new Map<string, any>();
    const imeiItems = items.filter((item: any) => item.imei && !item.isPreorder);
    if (imeiItems.length > 0) {
      const imeis = imeiItems.map((item: any) => item.imei);
      const inventoryUnits = await prisma.inventoryItem.findMany({
        where: { imei: { in: imeis } },
        select: { id: true, imei: true, productId: true, status: true, salePrice: true },
      });
      for (const unit of inventoryUnits) imeiMap.set(unit.imei, unit);

      for (const item of imeiItems) {
        const unit = imeiMap.get(item.imei);
        if (!unit) {
          throw { status: 400, message: `IMEI no encontrado: ${item.imei}` };
        }
        if (unit.productId !== item.id) {
          throw { status: 400, message: `El IMEI ${item.imei} no pertenece al producto ${item.name}` };
        }
        if (unit.status !== 'IN_STOCK') {
          throw { status: 400, message: `El equipo con IMEI ${item.imei} no está disponible (${unit.status})` };
        }
      }
    }

    // Build enriched items with server-side prices
    const enrichedItems: any[] = [];
    for (const item of items) {
      if (item.type === 'accesorio') {
        const accessory = accessoryMap.get(item.id);
        if (!accessory) throw { status: 400, message: `Accesorio no encontrado: ${item.name}` };
        if (accessory.stock < item.quantity) {
          throw { status: 400, message: `Stock insuficiente para ${item.name}. Disponible: ${accessory.stock}` };
        }
        const unitPrice = getEffectivePrice(accessory);
        enrichedItems.push({ ...item, accessory, unitPrice, product: null });
      } else {
        const product = productMap.get(item.id);
        if (!product) throw { status: 400, message: `Producto no encontrado: ${item.name}` };
        if (!item.isPreorder && product.stock < item.quantity) {
          throw { status: 400, message: `Stock insuficiente para ${item.name}. Disponible: ${product.stock}` };
        }
        const unitPrice = getEffectivePrice(product);
        enrichedItems.push({ ...item, product, unitPrice, accessory: null });
      }
    }

    // Recalculate totals server-side — never trust frontend amounts
    const calculatedSubtotal = enrichedItems.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const calculatedWarrantyCost = WARRANTY_COST_MAP[warranty] ?? 0;
    // Usar validation.data (sanitizado por Zod) — NUNCA body crudo
    const safeDeliveryCost = Math.max(0, (validation.data as any).deliveryCost || 0);
    const calculatedTotal = calculatedSubtotal + calculatedWarrantyCost + safeDeliveryCost;

    // Cross-check: reject if frontend total doesn't match
    if ((validation.data as any).total !== calculatedTotal) {
      return NextResponse.json({ error: 'Error de validación: el total no coincide. Reintente.' }, { status: 400 });
    }

    // ---- COUPON HANDLING (read-only validation, atomic decrement inside tx) ----
    let couponDiscount = 0;
    let validatedCoupons: Array<{ id: string; code: string; remainingAmount: number }> = [];

    if (couponIds && Array.isArray(couponIds) && couponIds.length > 0) {
      const coupons = await prisma.coupon.findMany({
        where: { id: { in: couponIds }, userId, status: 'ACTIVE' },
        select: { id: true, code: true, remainingAmount: true }
      });

      if (coupons.length !== couponIds.length) {
        return NextResponse.json({ error: 'Uno o más cupones no son válidos' }, { status: 400 });
      }

      for (const c of coupons) {
        if (c.remainingAmount <= 0) {
          return NextResponse.json({ error: `El cupón ${c.code} no tiene saldo disponible` }, { status: 400 });
        }
      }

      couponDiscount = coupons.reduce((sum, c) => sum + c.remainingAmount, 0);
      validatedCoupons = coupons.map(c => ({ id: c.id, code: c.code, remainingAmount: c.remainingAmount }));

      if (couponDiscount > calculatedTotal) {
        couponDiscount = calculatedTotal;
      }
    }

    const totalAfterCoupons = calculatedTotal - couponDiscount;
    const isFullyPaidByCoupons = totalAfterCoupons <= 0;
    // ---- END COUPON HANDLING ----

    // Build MP preference items with server-side prices
    const mpItems: any[] = enrichedItems.map((item: any, idx: number) => ({
      id: `${orderCode}-item-${idx}`,
      title: (item.product || item.accessory).name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      currency_id: 'ARS',
      picture_url: (item.product || item.accessory).imageUrl || undefined,
      description: `${(item.product || item.accessory).brand || ''} ${(item.product || item.accessory).sub || ''}`.trim() || (item.product || item.accessory).name
    }));

    if (calculatedWarrantyCost > 0) {
      mpItems.push({
        id: `${orderCode}-warranty`,
        title: 'Garantía extendida',
        unit_price: calculatedWarrantyCost,
        quantity: 1,
        currency_id: 'ARS',
        picture_url: undefined,
        description: `Garantía ${warranty}`,
      });
    }

    if (safeDeliveryCost > 0) {
      mpItems.push({
        id: `${orderCode}-delivery`,
        title: `Envío - ${delivery || 'Estándar'}`,
        unit_price: safeDeliveryCost,
        quantity: 1,
        currency_id: 'ARS',
        picture_url: undefined,
        description: `Costo de envío${carrier ? ' via ' + carrier : ''}`,
      });
    }

    let preferenceId: string | null = null;
    let initPoint: string | null = null;

    if (!isFullyPaidByCoupons) {
      const cleanDoc = (document || '').replace(/[^0-9]/g, '');
      const idType = cleanDoc.length > 8 ? 'CUIT' : 'DNI';

      const excludedTypes: Record<string, string[]> = {
        mercadopago: [],
        tarjeta: ['ticket', 'bank_transfer', 'atm', 'prepaid_card'],
        efectivo: ['credit_card', 'debit_card', 'bank_transfer', 'atm', 'prepaid_card'],
      };
      const excluded = excludedTypes[paymentMethod || 'mercadopago'] || excludedTypes.mercadopago;

      const preferenceData = {
        items: mpItems,
        payer: {
          email: email,
          name: user.name || 'Cliente',
          surname: '',
          phone: { number: phone || '0000000000' },
          identification: { type: idType, number: cleanDoc },
          address: {
            street_name: street,
            street_number: number,
            apartment: floor || '',
            city: city,
            state: province,
            zip_code: zip
          }
        },
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/success?order=${orderCode}`,
          failure: `${process.env.NEXTAUTH_URL}/failure?order=${orderCode}`,
          pending: `${process.env.NEXTAUTH_URL}/pending?order=${orderCode}`
        },
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
        external_reference: orderCode,
        auto_return: 'approved' as const,
        payment_types: { excluded_types: excluded }
      };

      const mpPreference = new Preference(client);
      const mpResponse = await mpPreference.create({ body: preferenceData });
      preferenceId = mpResponse.id || '';
      if (!preferenceId) throw new Error('Failed to create MercadoPago preference');
      initPoint = mpResponse.init_point || null;
    }

    console.log('[Checkout] Starting transaction for order:', orderCode);
    const isPreorderOrder = hasPreorderItems && enrichedItems.every((item: any) => item.isPreorder);
    const saleChannel = isPreorderOrder ? 'preorder' : 'online';

    const order = await prisma.$transaction(async (tx) => {
      // Reserve stock only for non-preorder items
      const stockItems = enrichedItems
        .filter((item: any) => !item.isPreorder)
        .map((item: any) => ({
          productId: item.product?.id || null,
          accessoryId: item.accessory?.id || null,
          quantity: item.quantity,
        }));
      if (stockItems.length > 0) {
        await reserveStock(tx, stockItems);
      }

      // Reserve specific inventory units (IMEI items)
      const itemInventoryMap = new Map<string, string>();
      for (const item of enrichedItems) {
        if (item.imei && imeiMap.has(item.imei)) {
          const unit = imeiMap.get(item.imei);
          await tx.inventoryItem.update({
            where: { id: unit.id },
            data: {
              status: 'RESERVED',
              salePrice: item.unitPrice,
            },
          });
          itemInventoryMap.set(item.imei, unit.id);
        }
      }

      const orderStatus = isFullyPaidByCoupons ? 'PROCESSING' : 'PENDING';
      const orderPayment = isFullyPaidByCoupons ? 'coupons' : (paymentMethod || 'mercadopago');

      const created = await tx.order.create({
        data: {
          code: orderCode,
          userId: userId,
          status: orderStatus,
          payment: orderPayment,
          warranty: warranty || '12 meses',
          cuotas: cuotas || 1,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          warrantyCost: calculatedWarrantyCost,
          deliveryCost: safeDeliveryCost,
          clientEmail: email,
          clientPhone: phone,
          clientDni: document,
          shippingStreet: street,
          shippingNumber: number,
          shippingFloor: floor,
          shippingZip: zip,
          shippingCity: city,
          shippingProvince: province,
          carrier: carrier || null,
          carrierService: carrierService || null,
          saleChannel,
          mpPreferenceId: preferenceId,
          items: {
            create: enrichedItems.map((item: any) => ({
              productId: item.product?.id || null,
              accessoryId: item.accessory?.id || null,
              inventoryItemId: item.imei ? (itemInventoryMap.get(item.imei) || null) : null,
              quantity: item.quantity,
              price: item.unitPrice
            }))
          }
        }
      });

      // ---- ATOMIC coupon decrement inside transaction ----
      if (validatedCoupons.length > 0) {
        let remainingDiscount = couponDiscount;
        for (const c of validatedCoupons) {
          const amountToUse = Math.min(c.remainingAmount, remainingDiscount);
          if (amountToUse <= 0) continue;

          await tx.orderCoupon.create({
            data: {
              orderId: created.id,
              couponId: c.id,
              amountUsed: amountToUse,
            }
          });

          const updateResult = await tx.coupon.updateMany({
            where: {
              id: c.id,
              remainingAmount: { gte: amountToUse },
              status: 'ACTIVE',
            },
            data: {
              remainingAmount: { decrement: amountToUse },
            }
          });

          if (updateResult.count === 0) {
            throw new Error(`El cupón ${c.code} ya fue usado en otra compra`);
          }

          // Mark as USED if fully consumed
          const updatedCoupon = await tx.coupon.findUnique({
            where: { id: c.id },
            select: { remainingAmount: true },
          });
          if (updatedCoupon && updatedCoupon.remainingAmount <= 0) {
            await tx.coupon.update({
              where: { id: c.id },
              data: { status: 'USED', usedAt: new Date() },
            });
          }

          remainingDiscount -= amountToUse;

          // Create payment transaction for coupon
          await tx.paymentTransaction.create({
            data: {
              orderId: created.id,
              amount: amountToUse,
              method: 'coupon',
              status: 'approved',
              installments: 1,
              notes: `Cupón ${c.code}`,
            }
          });
        }
      }

      // Create payment transaction for MercadoPago portion
      const mpAmount = Math.max(0, calculatedTotal - couponDiscount);
      if (mpAmount > 0 && preferenceId) {
        const pmMethod = (paymentMethod || 'mercadopago');
        await tx.paymentTransaction.create({
          data: {
            orderId: created.id,
            amount: mpAmount,
            method: pmMethod === 'tarjeta' ? 'card' : pmMethod,
            status: 'pending',
            installments: cuotas || 1,
            mpPaymentId: null,
          }
        });
      }

      // Create PreOrder records for preorder items
      if (hasPreorderItems && saleChannel === 'preorder') {
        for (const item of enrichedItems) {
          if (item.isPreorder && item.product) {
            const preCode = `PRE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await tx.preOrder.create({
              data: {
                code: preCode,
                clientName: user.name || email.split('@')[0],
                clientDni: document || null,
                clientPhone: phone || null,
                clientEmail: email,
                productId: item.product.id,
                productModelName: item.product.name,
                productStorage: item.product.storage || null,
                productColor: item.product.color || null,
                productCondition: item.product.condition || 'Nuevo',
                price: item.unitPrice,
                paymentMethod: paymentMethod || 'mercadopago',
                installments: cuotas || 1,
                status: isFullyPaidByCoupons ? 'CONFIRMED' : 'PENDING',
                source: 'online',
                agreedToTerms: true,
                userId: userId,
                orderId: created.id,
                mpPreferenceId: preferenceId,
              }
            });
          }
        }
      }

      return created;
    });
    console.log('[Checkout] Transaction committed. Order:', { id: order.id, code: order.code, status: order.status });

    productCache.clear();

    if (isFullyPaidByCoupons) {
      logger.info({ orderCode: order.code }, 'Sending coupon confirmation email');
      sendOrderConfirmationEmail({
        orderCode: order.code,
        email,
        phone: phone || '',
        total: order.total,
        items: enrichedItems.map((item: any) => ({
          name: (item.product || item.accessory).name,
          quantity: item.quantity,
          price: item.unitPrice
        })),
        shippingAddress: [street, number, floor, city, province, zip].filter(Boolean).join(', '),
        paymentMethod: validatedCoupons.map(c => c.code).join(', ') || 'Cupón',
        installments: 1,
      }).catch((err) => console.error('[Checkout] Error sending confirmation email:', err));

      sendNewOrderAdminNotification({
        orderCode: order.code,
        clientName,
        total: order.total,
        itemCount: enrichedItems.length,
        paymentMethod: validatedCoupons.map(c => c.code).join(', ') || 'Cupón',
      }).catch(() => {});
    }

    console.log('[Checkout] SUCCESS — Returning response. OrderId:', order.id, 'OrderCode:', order.code);
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode: order.code,
      initPoint: initPoint,
      preferenceId: preferenceId,
      couponDiscount,
      totalAfterCoupons,
      itemCount: enrichedItems.length,
      isPreorder: saleChannel === 'preorder',
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error !== null && typeof error === 'object' && 'status' in error && 'message' in error) {
      const err = error as { status: number; message: string }
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 })
  }
}
