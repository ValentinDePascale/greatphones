import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData) {
        const pd = paymentData as any;
        const preferenceId = pd.preference_id;
        const status = pd.status;

        const order = await prisma.order.findFirst({
          where: { mpPreferenceId: preferenceId }
        });

        if (order) {
          let orderStatus = 'PENDING';
          
          switch (status) {
            case 'approved':
              orderStatus = 'PROCESSING';
              break;
            case 'pending':
              orderStatus = 'PENDING';
              break;
            case 'rejected':
            case 'cancelled':
              orderStatus = 'CANCELLED';
              break;
          }

          await prisma.order.update({
            where: { id: order.id },
            data: {
              mpPaymentId: paymentId.toString(),
              mpStatus: status,
              status: orderStatus as any
            }
          });
        }
      }
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