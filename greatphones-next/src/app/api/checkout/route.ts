import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CheckoutSchema, formatZodError } from '@/lib/validations';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { productCache } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const WARRANTY_COST_MAP: Record<string, number> = {
  '90 días': 0,
  '+12 meses': 85000,
  '+24 meses': 150000,
};

function getEffectivePrice(product: any): number {
  if (product.isOffer && product.discount && product.discount > 0) {
    const now = new Date();
    const start = product.offerStart ? new Date(product.offerStart) : null;
    const end = product.offerEnd ? new Date(product.offerEnd) : null;
    if ((!start || start <= now) && (!end || end >= now)) {
      return Math.round(product.price * (1 - product.discount / 100));
    }
  }
  return product.price;
}

function generateOrderCode() {
  const prefix = 'GP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

async function findOrCreateUser(email: string, phone?: string, document?: string) {
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        phone: phone || null,
        dni: document || null,
      }
    });
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Checkout] Body:', JSON.stringify({ itemsN:body.items?.length, email:body.email, total:body.total, subtotal:body.subtotal, pm:body.paymentMethod, cids:body.coupons, doc:body.document?.substring(0,3)+'***', street:!!body.street, city:!!body.city, province:!!body.province, zip:!!body.zip }));
    const validation = CheckoutSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Checkout] Zod FAIL:', JSON.stringify(validation.error.issues));
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }
    console.log('[Checkout] Zod OK');

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const checkoutLimit = await rateLimit(`checkout:${ip}`, 10, 300000)
    if (!checkoutLimit.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera 5 minutos.' }, { status: 429 })
    }

    const { 
      items, email, phone, street, number, floor, zip, city, province, document,
      warranty, delivery, cuotas, carrier, carrierService, paymentMethod,
      coupons: couponIds,
    } = body;

    const user = await findOrCreateUser(email, phone, document);
    const userId = user.id;

    const orderCode = generateOrderCode();

    // Fetch products from DB
    const productIds = items.map((item: any) => item.id);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Build enriched items with server-side prices
    const enrichedItems = items.map((item: any) => {
      const product = productMap.get(item.id);
      if (!product) throw { status: 400, message: `Producto no encontrado: ${item.name}` };
      if (product.stock < item.quantity) {
        throw { status: 400, message: `Stock insuficiente para ${item.name}. Disponible: ${product.stock}` };
      }
      const unitPrice = getEffectivePrice(product);
      return { ...item, product, unitPrice };
    });

    // Recalculate totals server-side — never trust frontend amounts
    const calculatedSubtotal = enrichedItems.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const calculatedWarrantyCost = WARRANTY_COST_MAP[warranty] ?? 0;
    const calculatedTotal = calculatedSubtotal + calculatedWarrantyCost + (body.deliveryCost || 0);

    // Cross-check: reject if frontend total doesn't match
    if (body.total !== calculatedTotal) {
      return NextResponse.json({ error: 'Error de validación: el total no coincide. Reintente.' }, { status: 400 });
    }

    // ---- COUPON HANDLING ----
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
    console.log('[Checkout] Coupons:', { count: validatedCoupons.length, discount: couponDiscount, calcTotal: calculatedTotal, afterCoupons: totalAfterCoupons, fullyPaid: isFullyPaidByCoupons });
    // ---- END COUPON HANDLING ----

    // Build MP preference items with server-side prices
    const mpItems = enrichedItems.map((item: any) => ({
      title: item.product.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      currency_id: 'ARS',
      picture_url: item.product.imageUrl || undefined,
      description: `${item.product.brand || ''} ${item.product.sub || ''}`.trim() || item.product.name
    }));

    if (calculatedWarrantyCost > 0) {
      mpItems.push({
        title: 'Garantía extendida',
        unit_price: calculatedWarrantyCost,
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    if (body.deliveryCost > 0) {
      mpItems.push({
        title: `Envío - ${delivery || 'Estándar'}`,
        unit_price: body.deliveryCost,
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    let preferenceId: string | null = null;
    let initPoint: string | null = null;

    if (!isFullyPaidByCoupons) {
      const cleanDoc = document.replace(/[^0-9]/g, '');
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
    const order = await prisma.$transaction(async (tx) => {
      for (const item of enrichedItems) {
        const updated = await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          }
        });
        console.log('[Checkout] Stock updated:', { productId: item.product.id, name: item.product.name, oldStock: updated.stock + item.quantity, newStock: updated.stock, reserved: updated.reserved, dec: item.quantity });
        if (updated.stock < 0) {
          throw new Error(`Stock insuficiente para ${item.product.name}`);
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
          warranty: warranty || '90 dias',
          cuotas: cuotas || 1,
          subtotal: calculatedSubtotal,
          total: isFullyPaidByCoupons ? 0 : calculatedTotal,
          warrantyCost: calculatedWarrantyCost,
          deliveryCost: body.deliveryCost || 0,
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
          mpPreferenceId: preferenceId,
          items: {
            create: enrichedItems.map((item: any) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.unitPrice
            }))
          }
        }
      });
      console.log('[Checkout] Order created:', { id: created.id, code: created.code, status: created.status, payment: created.payment, total: created.total });

      // Create OrderCoupon records and update coupon balances
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

          const newRemaining = c.remainingAmount - amountToUse;
          const newStatus = newRemaining <= 0 ? 'USED' : 'ACTIVE';

          await tx.coupon.update({
            where: { id: c.id },
            data: {
              remainingAmount: newRemaining,
              status: newStatus,
              usedAt: newStatus === 'USED' ? new Date() : undefined,
            }
          });

          remainingDiscount -= amountToUse;
        }
      }

      return created;
    });
    console.log('[Checkout] Transaction committed. Order:', { id: order.id, code: order.code, status: order.status });

    productCache.clear();

    if (isFullyPaidByCoupons) {
      console.log('[Checkout] Sending coupon confirmation email to:', email);
      sendOrderConfirmationEmail({
        orderCode: order.code,
        email,
        phone: phone || '',
        total: order.total,
        items: enrichedItems.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.unitPrice
        })),
        shippingAddress: [street, number, floor, city, province, zip].filter(Boolean).join(', '),
        paymentMethod: validatedCoupons.map(c => c.code).join(', ') || 'Cupón',
        installments: 1,
      }).catch((err) => console.error('[Checkout] Error sending confirmation email:', err));
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
      stockUpdated: enrichedItems.map((item: any) => ({ id: item.product.id, name: item.product.name })),
      itemCount: enrichedItems.length,
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    if (error.status) {
      return NextResponse.json({ error: error.message || 'Error al procesar el pago' }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Error al procesar el pago. Intenta novamente.' },
      { status: 500 }
    );
  }
}
