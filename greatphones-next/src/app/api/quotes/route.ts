import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewQuoteEmail } from '@/lib/email'
import { requireSession, requireAdmin } from '@/lib/auth-guard'

export async function GET(request: Request) {
  try {
    const user = await requireSession(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (user.role !== 'ADMIN') {
      where.userId = user.id
    } else if (searchParams.get('userId')) {
      where.userId = searchParams.get('userId')
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
    
    const user = await requireSession(request)
    const {
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

    if (!device || !storage || !condition || !finalPrice) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const quoteUserId = user.role === 'ADMIN' && body.userId ? body.userId : user.id
    
    const code = `QT-${Date.now()}`
    
    const quote = await prisma.quote.create({
      data: {
        code,
        userId: quoteUserId,
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
    await requireAdmin(request)
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

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de cotización requerido' }, { status: 400 })
    }

    await prisma.quote.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}
