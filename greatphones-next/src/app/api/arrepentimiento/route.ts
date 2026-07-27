import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendArrepentimientoEmail, sendArrepAcceptEmail, sendArrepRejectEmail } from '@/lib/email'
import { requireSession, requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const list = await prisma.arrepentimiento.findMany({
      include: {
        order: {
          select: {
            code: true,
            total: true,
            clientEmail: true,
            clientDni: true,
            clientPhone: true,
            shippingStreet: true,
            shippingNumber: true,
            shippingCity: true,
            shippingProvince: true,
            arrepReason: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const transformed = list.map(item => ({
      ...item,
      orderCode: item.order?.code || null,
      orderTotal: item.order?.total || null,
      orderDni: item.order?.clientDni || null,
      orderPhone: item.order?.clientPhone || null,
      reason: item.order?.arrepReason || null,
      orderShipping: item.order ? {
        street: item.order.shippingStreet,
        number: item.order.shippingNumber,
        city: item.order.shippingCity,
        province: item.order.shippingProvince,
      } : null,
    }))
    
    return NextResponse.json(transformed)
  } catch (e) {
    console.error('[ARREPENTIMIENTO] Error fetching:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { estado, rejectReason } = body
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 })
    }
    
    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
      return NextResponse.json({ success: false, message: 'Estado invalido' }, { status: 400 })
    }

    const arrep = await prisma.arrepentimiento.findUnique({
      where: { id },
      include: { order: true }
    })

    if (!arrep) {
      return NextResponse.json({ success: false, message: 'Arrepentimiento no encontrado' }, { status: 404 })
    }

    if (arrep.estado !== 'PENDIENTE') {
      return NextResponse.json({ success: false, message: 'Este arrepentimiento ya fue procesado' }, { status: 400 })
    }

    if (estado === 'APROBADO') {
      // Aceptar arrepentimiento - Ley 24.240
      await prisma.$transaction([
        prisma.arrepentimiento.update({
          where: { id },
          data: { estado: 'APROBADO' }
        }),
        prisma.order.update({
          where: { id: arrep.orderId },
          data: {
            status: 'CANCELLED',
            arrepStatus: 'ARREP_OK',
            notes: `Arrepentimiento aceptado - Devolucion procesada segun Ley 24.240 (Res. 424/2020). Reembolso total: $${arrep.order.total.toLocaleString('es-AR')}`,
          }
        })
      ])

      try {
        await sendArrepAcceptEmail({
          orderCode: arrep.order.code,
          email: arrep.email,
          total: arrep.order.total,
          shippingAddress: [arrep.order.shippingStreet, arrep.order.shippingNumber, arrep.order.shippingCity, arrep.order.shippingProvince].filter(Boolean).join(', '),
        })
      } catch (emailError) {
        console.error('[ARREP] Error sending accept email:', emailError)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Arrepentimiento aceptado. Se notifico al cliente con instrucciones de devolucion.' 
      })

    } else {
      // Rechazar arrepentimiento
      if (!rejectReason) {
        return NextResponse.json({ success: false, message: 'Motivo de rechazo requerido' }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.arrepentimiento.update({
          where: { id },
          data: { estado: 'RECHAZADO' }
        }),
        prisma.order.update({
          where: { id: arrep.orderId },
          data: {
            arrepStatus: 'ARREP_RECHAZADO',
            arrepReason: rejectReason,
            notes: `Arrepentimiento rechazado - Motivo: ${rejectReason}`,
          }
        })
      ])

      try {
        await sendArrepRejectEmail({
          orderCode: arrep.order.code,
          email: arrep.email,
          reason: rejectReason,
        })
      } catch (emailError) {
        console.error('[ARREP] Error sending reject email:', emailError)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Arrepentimiento rechazado. Se notifico al cliente.' 
      })
    }
  } catch (e) {
    console.error('[ARREP PUT] Error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ success: false, message: 'Error interno: ' + message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(request)
    const body = await request.json()
    
    const { orderId, orden, email, telefono, motivo } = body
    const finalOrderId = orderId || orden
    
    if (!finalOrderId || !email) {
      return NextResponse.json(
        { success: false, message: 'Orden y email requeridos' },
        { status: 400 }
      )
    }

    const orderData = await prisma.order.findFirst({
      where: { code: finalOrderId },
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
