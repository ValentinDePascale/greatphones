import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuoteCreateSchema, formatZodError } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }
    
    const quotes = await prisma.quote.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar body con Zod (solo device es obligatorio)
    const validation = QuoteCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
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
      signature,
    } = body
    
    const code = `QT-${Date.now()}`
    
    const quote = await prisma.quote.create({
      data: {
        code,
        userId: userId || 'guest',
        device,
        storage,
        condition,
        basePrice,
        finalPrice,
        bonus,
        status: 'PENDING',
        envio,
        payment,
        clientName,
        clientDni,
        clientPhone,
        clientCity,
        signature,
      },
    })
    
    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}