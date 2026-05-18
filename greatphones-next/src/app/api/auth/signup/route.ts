// ============ SIGNUP API ============
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignupSchema, formatZodError } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET() {
  return NextResponse.json({ 
    message: 'Signup API working',
    prismaConnected: !!prisma 
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const validation = SignupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const { email, name, phone, dni, provincia, ciudad, password, verified } = body

    const limit = rateLimit(`signup:${email}`, 3, 60 * 60 * 1000)
    if (!limit.allowed) {
      const mins = Math.ceil((limit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ error: `Demasiados registros. Espera ${mins} minutos` }, { status: 429 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email,
        phone,
        dni,
        provincia,
        ciudad,
        password: hashedPassword,
        role: 'CLIENT',
        verified: verified || false,
      }
    })

    return NextResponse.json({ 
      message: 'Usuario creado',
      user: { id: user.id, email: user.email, name: user.name }
    }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': 'https://greatphones.onrender.com' }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
