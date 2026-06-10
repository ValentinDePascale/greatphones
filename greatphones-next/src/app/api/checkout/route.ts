import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CheckoutSchema, formatZodError } from '@/lib/validations';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

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
    
    // Validar body con Zod
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
      subtotal,
      warrantyCost,
      deliveryCost,
      total 
    } = body;

    // Find or create user from email
    const user = await findOrCreateUser(email, phone, document);
    const userId = user.id;

    const orderCode = generateOrderCode();

    const productIds = items.map((item: any) => item.id);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.name}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${item.name}. Disponible: ${product.stock}` }, { status: 400 });
      }
    }

    // Build MP preference items with proper descriptions
    const mpItems = items.map((item: any) => ({
      title: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      currency_id: 'ARS',
      picture_url: item.imageUrl || undefined,
      description: `${item.brand || ''} ${item.sub || ''}`.trim() || item.name
    }));

    // Add warranty as separate item if applicable
    if (warrantyCost && warrantyCost > 0) {
      mpItems.push({
        title: 'Garantia extendida 90 dias',
        unit_price: warrantyCost,
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    // Add shipping as separate item if applicable
    if (deliveryCost && deliveryCost > 0) {
      mpItems.push({
        title: `Envio - ${delivery || 'Estándar'}`,
        unit_price: deliveryCost,
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    // Determine identification type for Argentina
    const cleanDoc = document.replace(/[^0-9]/g, '');
    const idType = cleanDoc.length > 8 ? 'CUIT' : 'DNI';

    const preferenceData = {
      items: mpItems,
      payer: {
        email: email,
        name: user.name || 'Cliente',
        surname: '',
        phone: {
          number: phone || '0000000000'
        },
        identification: {
          type: idType,
          number: cleanDoc
        },
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
      payment_types: {
        excluded_types: []
      }
    };

    const mpPreference = new Preference(client);
    const mpResponse = await mpPreference.create({ body: preferenceData });
    const preferenceId = mpResponse.id || '';
    if (!preferenceId) throw new Error('Failed to create MercadoPago preference');
    const initPoint = mpResponse.init_point;

    // Create order with proper userId and mpPreferenceId, and deduct stock atomically
    const order = await prisma.$transaction(async (tx) => {
      // Reserve stock atomically
      for (const item of items) {
        const updated = await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          }
        });
        if (updated.stock < 0) {
          throw new Error(`Stock insuficiente para ${item.name}`);
        }
      }

      return tx.order.create({
        data: {
          code: orderCode,
          userId: userId,
          status: 'PENDING',
          warranty: warranty || '90 dias',
          cuotas: cuotas || 1,
          subtotal: subtotal,
          total: total,
          warrantyCost: warrantyCost || 0,
          deliveryCost: deliveryCost || 0,
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
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price
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
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago. Intenta novamente.' },
      { status: 500 }
    );
  }
}