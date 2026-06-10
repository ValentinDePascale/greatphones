import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendOrderConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

function verifyWebhookSignature(request: NextRequest): boolean {
  const signature = request.headers.get('x-signature') || '';
  const requestId = request.headers.get('x-request-id') || '';
  const dataId = request.headers.get('data-id') || '';

  if (!process.env.MP_WEBHOOK_SECRET) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const params = new URLSearchParams(request.url.split('?')[1] || '');
  const topic = params.get('topic') || params.get('type') || '';
  const id = params.get('id') || params.get('data.id') || '';

  const parts = [
    `id:${id || dataId}`,
    `topic:${topic}`,
    `request-id:${requestId}`,
    `wmid:${process.env.MP_WEBHOOK_SECRET}`,
  ];

  const stringToSign = parts.join('\n');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET || '')
    .update(stringToSign)
    .digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyWebhookSignature(request)) {
      console.error('[MP Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, action } = body;

    // Only process payment creation/update events
    if (type === 'payment' && (action === 'payment.created' || action === 'payment.updated')) {
      const paymentId = data.id;

      // Fetch payment details from MP
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (!paymentData) {
        return NextResponse.json({ received: true });
      }

      const pd = paymentData as any;
      const preferenceId = pd.preference_id;
      const externalReference = pd.external_reference;
      const status = pd.status;
      const paymentMethod = pd.payment_method_id;
      const installments = pd.installments || 1;

      // Find order by preference_id or external_reference (for in-store sales)
      let order = await prisma.order.findFirst({
        where: { mpPreferenceId: preferenceId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // If not found by preference_id, try by external_reference (order code)
      if (!order && externalReference) {
        order = await prisma.order.findFirst({
          where: { code: externalReference },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });
      }

      if (!order) {
        console.error('[MP Webhook] Order not found for preference:', preferenceId, 'or external_reference:', externalReference);
        return NextResponse.json({ received: true });
      }

      // Idempotency: if payment already processed, skip
      if (order.mpPaymentId === paymentId.toString()) {
        console.log('[MP Webhook] Payment already processed for order:', order.code);
        return NextResponse.json({ received: true });
      }

      // Determine order status based on payment status
      let orderStatus = order.status;
      
      switch (status) {
        case 'approved':
          orderStatus = 'PROCESSING';
          break;
        case 'pending':
          orderStatus = 'PENDING';
          break;
        case 'rejected':
        case 'cancelled':
        case 'refunded':
        case 'charged_back':
          orderStatus = 'CANCELLED';
          break;
        case 'in_process':
        case 'in_mediation':
          orderStatus = 'PENDING';
          break;
      }

      // Deduct stock if payment approved (release reservation)
      if (status === 'approved') {
        await Promise.all(
          order.items
            .filter((item: any) => item.productId)
            .map((item: any) => prisma.product.update({
              where: { id: item.productId },
              data: {
                reserved: { decrement: item.quantity },
                sold: { increment: item.quantity }
              }
            }).catch((err: Error) => {
              console.error('[MP Webhook] Error updating product:', item.productId, err);
            }))
        );
      } else if (status === 'rejected' || status === 'cancelled') {
        // Release reserved stock on payment failure
        await Promise.all(
          order.items
            .filter((item: any) => item.productId)
            .map((item: any) => prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                reserved: { decrement: item.quantity }
              }
            }).catch((err: Error) => {
              console.error('[MP Webhook] Error releasing stock for product:', item.productId, err);
            }))
        );
      }

      // Update order with payment info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: paymentId.toString(),
          mpStatus: status,
          payment: paymentMethod || null,
          cuotas: installments > 1 ? installments : order.cuotas,
          status: orderStatus as any
        }
      });

      // Send confirmation email if payment approved
      if (status === 'approved' && order.clientEmail) {
        try {
          await sendOrderConfirmationEmail({
            orderCode: order.code,
            email: order.clientEmail,
            phone: order.clientPhone || '',
            total: order.total,
            items: order.items.map(item => ({
              name: item.product?.name || 'Producto',
              quantity: item.quantity,
              price: item.price
            })),
            shippingAddress: [order.shippingStreet, order.shippingNumber, order.shippingFloor, order.shippingCity, order.shippingProvince, order.shippingZip].filter(Boolean).join(', '),
            paymentMethod: paymentMethod || 'Mercado Pago',
            installments: installments
          });
        } catch (emailError) {
          console.error('[MP Webhook] Error sending confirmation email:', emailError);
        }
      }

      console.log('[MP Webhook] Order', order.code, 'updated to', orderStatus, 'payment:', status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}