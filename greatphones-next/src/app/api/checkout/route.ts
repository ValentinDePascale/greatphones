import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CheckoutSchema, formatZodError } from '@/lib/validations';

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
    
    const validation = CheckoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }
    
    const { 
      items, 
      email, 
      phone,
      street, 
      number, 
      floor, 
      zip, 
      city, 
      province, 
      document,
      warranty,
      delivery,
      cuotas,
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

    // Cross-check: reject if frontend total doesn't match (detects price tampering)
    if (body.total !== calculatedTotal) {
      return NextResponse.json({ error: 'Error de validación: el total no coincide. Reintente.' }, { status: 400 });
    }

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

    const cleanDoc = document.replace(/[^0-9]/g, '');
    const idType = cleanDoc.length > 8 ? 'CUIT' : 'DNI';

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
      payment_types: { excluded_types: [] }
    };

    const mpPreference = new Preference(client);
    const mpResponse = await mpPreference.create({ body: preferenceData });
    const preferenceId = mpResponse.id || '';
    if (!preferenceId) throw new Error('Failed to create MercadoPago preference');
    const initPoint = mpResponse.init_point;

    const order = await prisma.$transaction(async (tx) => {
      for (const item of enrichedItems) {
        const updated = await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          }
        });
        if (updated.stock < 0) {
          throw new Error(`Stock insuficiente para ${item.product.name}`);
        }
      }

      return tx.order.create({
        data: {
          code: orderCode,
          userId: userId,
          status: 'PENDING',
          warranty: warranty || '90 dias',
          cuotas: cuotas || 1,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
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
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode: order.code,
      initPoint: initPoint,
      preferenceId: preferenceId
    });

  } catch (error: any) {
    if (error.status && error.message) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago. Intenta novamente.' },
      { status: 500 }
    );
  }
}