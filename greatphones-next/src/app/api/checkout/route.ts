import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import MercadoPago from 'mercadopago';
import { CheckoutSchema, formatZodError } from '@/lib/validations';

MercadoPago.configure({
  access_token: process.env.MP_ACCESS_TOKEN!,
  integrator_version: '1.0.0'
});

function generateOrderCode() {
  const prefix = 'GP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
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
      subtotal,
      total 
    } = body;

    let userId = 'anonymous';
    
    const preference = {
      items: items.map((item: any) => ({
        title: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        currency_id: 'ARS',
        picture_url: item.imageUrl || undefined,
        description: item.sub || item.name
      })),
      payer: {
        email: email,
        name: document.length > 8 ? 'Usuario' : 'Usuario',
        surname: document.length > 8 ? 'Empresa' : 'Final',
        phone: {
          number: phone || '0000000000'
        },
        identification: {
          type: document.length > 8 ? 'CNPJ' : 'DNI',
          number: document.replace(/[^0-9]/g, '')
        },
        address: {
          street_name: street,
          street_number: number,
          apartment: floor || '',
          city: city,
          state: province,
          zip_code: zip
        }
      }),
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/success`,
        failure: `${process.env.NEXTAUTH_URL}/failure`,
        pending: `${process.env.NEXTAUTH_URL}/pending`
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      external_reference: '',
      auto_return: 'approved' as const,
      payment_types: {
        excluded_types: []
      }
    };

    const mpResponse = await MercadoPago.preferences.create(preference);
    const preferenceId = mpResponse.body.id;
    const initPoint = mpResponse.body.init_point;

    const orderCode = generateOrderCode();
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: userId,
        status: 'PENDING',
        warranty: warranty ? '90 dias' : null,
        cuotas: 1,
        subtotal: subtotal,
        total: total,
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
            productName: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    await MercadoPago.preferences.update({
      id: preferenceId,
      update: {
        external_reference: order.id
      }
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