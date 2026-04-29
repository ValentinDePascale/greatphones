import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendArrepentimientoEmail } from '@/lib/email'
import { ArrepentimientoSchema, formatZodError } from '@/lib/validations'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  try {
    const list = await prisma.arrepentimiento.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(list)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { estado } = body
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 })
    }
    
    const updated = await prisma.arrepentimiento.update({
      where: { id },
      data: { estado }
    })
    
    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
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
        { success: false, message: 'El plazo de 10 días hábiles para desistir ha vencido.' },
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

    await sendArrepentimientoEmail({
      orderCode: orderData.code,
      email: email,
      telefono: telefono,
      motivo: motivo,
      tramite: registro.id
    })

    return NextResponse.json({
      success: true,
      message: 'Tu solicitud ha sido registrada.',
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