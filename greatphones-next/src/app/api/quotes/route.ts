import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewQuoteEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
        { clientDni: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { device: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const total = await prisma.quote.count({ where })
    const totalPages = Math.ceil(total / limit)
    
    const quotes = await prisma.quote.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    return NextResponse.json({ data: quotes, page, limit, total, totalPages })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      userId,
      device,
      storage,
      condition,
      basePrice,
      finalPrice,
      bonus,
      envio,
      payment,
      clientName,
      clientDni,
      clientPhone,
      clientCity,
      clientCp,
      clientProvince,
      signature,
      photos,
      extras,
    } = body

    if (!userId || !device || !storage || !condition || !finalPrice) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    
    const code = `QT-${Date.now()}`
    
    const quote = await prisma.quote.create({
      data: {
        code,
        userId,
        device,
        storage,
        condition,
        basePrice: parseInt(basePrice) || 0,
        finalPrice: parseInt(finalPrice),
        bonus: bonus ? parseInt(bonus) : null,
        status: 'PENDING',
        envio,
        payment,
        clientName,
        clientDni,
        clientPhone,
        clientCity,
        clientCp,
        clientProvince,
        signature,
        photos: photos || [],
        extras: extras || [],
      },
    })

    // Send notification email to admin (non-blocking)
    sendNewQuoteEmail({
      code: quote.code,
      device: quote.device,
      storage: quote.storage,
      condition: quote.condition,
      finalPrice: quote.finalPrice,
      clientName: quote.clientName || 'No especificado',
      clientPhone: quote.clientPhone || 'No especificado',
      clientEmail: quote.clientName ? '' : '',
      photos: quote.photos || [],
      extras: quote.extras || [],
    }).catch(err => console.error('[QUOTE] Error sending email:', err))
    
    return NextResponse.json({ success: true, quote }, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, rejectReason } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status,
        ...(rejectReason ? { rejectReason } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, quote })
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}
