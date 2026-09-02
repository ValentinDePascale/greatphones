import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, safeKeyPart, clientIpKey } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const ip = clientIpKey(request)
    const limit = await rateLimit(`warranty-check:${ip}`, 30, 60000)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera 1 minuto.' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const imei = searchParams.get('imei')

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: 'Código de compra requerido' }, { status: 400 })
    }

    // IMEI real (15 dígitos) para celulares, o un N° de serie alfanumérico
    // para equipos sin IMEI (laptops, tablets de otras marcas), incluyendo
    // los placeholders sintéticos "SN-..." que genera el alta sin IMEI.
    const imeiTrim = imei?.trim() || ''
    const esImeiValido = /^\d{15}$/.test(imeiTrim) || /^[A-Za-z0-9-]{4,40}$/.test(imeiTrim)
    if (!esImeiValido) {
      return NextResponse.json({ error: 'IMEI o N° de serie inválido' }, { status: 400 })
    }

    const imeiVal = imeiTrim

    // Rate-limit por par (código + IMEI) para mitigar enumeración
    const pairLimit = await rateLimit(`warranty-check-pair:${safeKeyPart(code)}:${safeKeyPart(imeiVal)}`, 5, 60000)
    if (!pairLimit.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos para esta orden/IMEI. Esperá un minuto.' }, { status: 429 })
    }

    const order = await prisma.order.findFirst({
      where: {
        code: { equals: code.trim(), mode: 'insensitive' }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                brand: true,
                sub: true,
                condition: true,
                imei: true,
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'No se encontró una orden con ese código' }, { status: 404 })
    }

    const productImeis = order.items
      .filter(i => i.product?.imei)
      .map(i => i.product!.imei!)

    const inventoryMatch = await prisma.inventoryItem.findFirst({
      where: { imei: imeiVal }
    })

    const imeiValid = productImeis.includes(imeiVal) || !!inventoryMatch

    if (!imeiValid) {
      return NextResponse.json({ error: 'El IMEI no corresponde a ningún producto de esta compra' }, { status: 400 })
    }

    // Calculate warranty info
    const createdAt = new Date(order.createdAt)
    let daysTotal = 365
    let warrantyType = 'Garantía legal 12 meses'

    if (order.warranty) {
      const w = order.warranty.toLowerCase()
      if (w.includes('24 meses') || w.includes('24 meses')) {
        daysTotal = 730
        warrantyType = 'Garantía extendida 24 meses'
      } else if (w.includes('12 meses') || w.includes('12 meses')) {
        daysTotal = 365
        warrantyType = 'Garantía extendida 12 meses'
      }
    }

    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + daysTotal)

    const now = new Date()
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isActive = daysRemaining > 0

    const daysSincePurchase = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const canExtend = daysSincePurchase <= 90 && !order.warranty?.includes('12') && !order.warranty?.includes('24')

    // Check existing warranty extension
    const existingExtend = await prisma.warrantyExtend.findFirst({
      where: {
        orderId: order.id,
        imei: imeiVal,
        status: 'ACTIVE'
      }
    })

    let extendInfo = null
    if (existingExtend) {
      const extExpires = new Date(existingExtend.endDate)
      const extActive = extExpires > now
      extendInfo = {
        active: extActive,
        plan: existingExtend.plan,
        months: existingExtend.months,
        expiresAt: existingExtend.endDate.toISOString(),
        expiresStr: extExpires.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
        type: existingExtend.plan === '24m' ? 'Garantía extendida 24 meses' : 'Garantía extendida 12 meses'
      }
    }

    return NextResponse.json({
      orderCode: order.code,
      status: order.status,
      createdAt: order.createdAt,
      imei: imeiVal,
      items: order.items.map(item => ({
        name: item.product?.name || 'Producto eliminado',
        imageUrl: item.product?.imageUrl || null,
        brand: item.product?.brand || '',
        quantity: item.quantity,
        price: item.price,
      })),
      warrantyInfo: {
        type: warrantyType,
        daysTotal,
        daysRemaining: isActive ? daysRemaining : 0,
        expiresAt: expiresAt.toISOString(),
        isActive,
        canExtend,
      },
      extendInfo
    })
  } catch (error) {
    console.error('[Warranty] Error:', error)
    return NextResponse.json({ error: 'Error al verificar garantía' }, { status: 500 })
  }
}
