import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendArrepentimientoEmail } from '@/lib/email'
import { ArrepentimientoSchema, formatZodError } from '@/lib/validations'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar body con Zod
    const validation = ArrepentimientoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const { orderId, email, telefono, motivo } = body

    const orderData = await prisma.order.findFirst({
      where: { code: orderId },
      include: { user: true }
    })

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    const fechaOrden = new Date(orderData.createdAt).getTime()
    const fechaActual = Date.now()
    const diasDiff = Math.floor((fechaActual - fechaOrden) / (1000 * 60 * 60 * 24))

    if (diasDiff > 10) {
      return NextResponse.json(
        { success: false, message: 'El plazo de 10 días hábiles para desistir ha vencido. Según Resolución 424/2020, este derecho expira a los 10 días corridos desde la recepción del producto.' },
        { status: 400 }
      )
    }

    if (orderData.user && orderData.user.email !== email) {
      return NextResponse.json(
        { success: false, message: 'El email no coincide con el registrado en la orden' },
        { status: 400 }
      )
    }

    const existingArrep = await prisma.arrepentimiento.findFirst({
      where: { orderId: orderData.id }
    })

    if (existingArrep) {
      return NextResponse.json(
        { success: false, message: 'Ya existe una solicitud de arrepentimiento para esta orden' },
        { status: 400 }
      )
    }

    const registro = await prisma.arrepentimiento.create({
      data: {
        orderId: orderData.id,
        userId: orderData.userId || null,
        email: email,
        telefono: telefono || null,
        motivo: motivo || null,
        estado: 'PENDIENTE'
      }
    })

    console.log('[ARREPENTIMIENTO] Nueva solicitud:', {
      id: registro.id,
      orderId: orderId,
      email: email,
      fecha: new Date().toISOString()
    })

    await sendArrepentimientoEmail({
      orderCode: orderData.code,
      email: email,
      telefono: telefono,
      motivo: motivo,
      tramite: registro.id
    })

    return NextResponse.json({
      success: true,
      message: 'Tu solicitud ha sido registrada. Te hemos enviado un email de confirmación con el número de trámite.',
      tramite: registro.id
    })

  } catch (error) {
    console.error('[ARREPENTIMIENTO] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}