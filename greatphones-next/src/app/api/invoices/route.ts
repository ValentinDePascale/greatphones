import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { apiResponse, apiError } from '@/lib/response'
import {
  arcaIsConfigured,
  arcaPtoVta,
  getArcaClient,
  buildFacturarOpts,
  caeExpiryToDate,
  type ArcaCbteLetter,
} from '@/lib/arca'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)

    if (orderId) {
      const invoice = await prisma.invoice.findUnique({
        where: { orderId },
        include: { order: { select: { code: true, clientName: true } } },
      })
      if (!invoice) return apiError('La orden no tiene factura', 404)
      return apiResponse(invoice)
    }

    const where = {}
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { order: { select: { code: true, clientName: true, total: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return apiResponse(invoices, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

interface CreateInvoiceBody {
  orderId: string
  cbteTipo?: ArcaCbteLetter
  docTipo?: number
  docNro?: number
  condicionIva?: number
  ptoVta?: number
  fecha?: string
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)

    if (!arcaIsConfigured()) {
      return apiError(
        'ARCA no está configurado. Configurá ARCA_CUIT, ARCA_CERT y ARCA_KEY en las variables de entorno.',
        400,
      )
    }

    const body = (await request.json()) as CreateInvoiceBody
    if (!body.orderId) {
      return apiError('orderId es requerido', 400)
    }

    const cbteTipo: ArcaCbteLetter = body.cbteTipo || 'C'
    if (!['A', 'B', 'C'].includes(cbteTipo)) {
      return apiError('cbteTipo inválido. Usá "A", "B" o "C"', 400)
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: {
        user: { select: { dni: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    })

    if (!order) return apiError('Orden no encontrada', 404)

    const existing = await prisma.invoice.findUnique({ where: { orderId: order.id } })
    if (existing) {
      return apiError(`La orden ya tiene una factura ${existing.type} N° ${existing.number}`, 409)
    }

    const itemSources = order.items.map(item => ({
      name: item.product?.name || item.customName || 'Producto',
      quantity: item.quantity,
      price: item.price,
    }))
    if (order.warrantyCost > 0) {
      itemSources.push({ name: 'Garantía extendida', quantity: 1, price: order.warrantyCost })
    }
    if (order.deliveryCost > 0) {
      itemSources.push({ name: 'Envío', quantity: 1, price: order.deliveryCost })
    }

    const built = buildFacturarOpts({
      cbteTipo,
      items: itemSources,
      receptor: {
        clientCuil: order.clientCuil,
        clientDni: order.clientDni,
        userDni: order.user?.dni,
      },
      overrides: {
        docTipo: body.docTipo,
        docNro: body.docNro,
        condicionIva: body.condicionIva,
        ptoVta: body.ptoVta,
        fecha: body.fecha,
      },
    })

    let result
    try {
      const arca = getArcaClient()
      result = await arca.facturar(built.opts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido de ARCA'
      console.error('[Invoices] Error al facturar:', err)
      return apiError(`Error al facturar con ARCA: ${message}`, 502)
    }

    if (!result.aprobada) {
      const details = result.observaciones.map(o => ({ code: o.code, msg: o.msg }))
      return apiError('ARCA rechazó el comprobante', 400, { observaciones: details })
    }

    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        type: cbteTipo,
        pos: result.ptoVta || arcaPtoVta(),
        number: result.cbteNro,
        cae: result.cae,
        caeExpiry: result.caeVencimiento ? caeExpiryToDate(result.caeVencimiento) : null,
        total: Math.round(built.total),
        netAmount: Math.round(built.neto),
        ivaAmount: Math.round(built.iva),
        status: 'APPROVED',
      },
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
