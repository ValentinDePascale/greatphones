import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wextId = searchParams.get('wextId')
    const paymentId = searchParams.get('payment_id')

    if (!wextId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const wext = await prisma.warrantyExtend.findUnique({ where: { id: wextId } })
    if (!wext) {
      return NextResponse.json({ error: 'Extensión no encontrada' }, { status: 404 })
    }

    if (wext.status === 'ACTIVE') {
      return NextResponse.json({ success: true, status: 'ACTIVE' })
    }

    if (wext.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ success: false, status: wext.status })
    }

    // If we have a payment_id from MP redirect, verify it directly
    if (paymentId) {
      try {
        const mpPayment = new Payment(client)
        const paymentData = await mpPayment.get({ id: paymentId })
        const status = paymentData?.status

        if (status === 'approved') {
          await prisma.warrantyExtend.update({
            where: { id: wext.id },
            data: {
              status: 'ACTIVE',
              mpPaymentId: paymentId.toString(),
              mpStatus: 'approved',
            }
          })
          return NextResponse.json({ success: true, status: 'ACTIVE' })
        }

        return NextResponse.json({ success: false, status: 'PENDING', message: `Pago ${status}` })
      } catch (mpError) {
        console.error('[Warranty Confirm] MP verify error:', mpError)
      }
    }

    // No payment_id or verification failed — webhook will handle it
    return NextResponse.json({ success: false, status: 'PENDING', message: 'Esperando confirmación del pago...' })
  } catch (error) {
    console.error('[Warranty Confirm] Error:', error)
    return NextResponse.json({ error: 'Error al confirmar' }, { status: 500 })
  }
}
