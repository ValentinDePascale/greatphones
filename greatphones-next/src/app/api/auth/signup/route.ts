// ============ SIGNUP API ============
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignupSchema, formatZodError } from '@/lib/validations'

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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  console.log('[SIGNUP] Request received')
  
  try {
    const body = await request.json()
    
    // Validar body con Zod
    const validation = SignupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const { email, name, phone, dni, provincia, ciudad, password } = body

    console.log('[SIGNUP] Checking if user exists:', email)
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    console.log('[SIGNUP] Existing:', existing)

    if (existing) {
      return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 400 })
    }

    console.log('[SIGNUP] Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('[SIGNUP] Creating user...')
    console.log('[SIGNUP] Data:', { email, name, phone, dni, provincia, ciudad })
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
        verified: true,
      }
    })
    console.log('[SIGNUP] User created:', user.id)

    return NextResponse.json({ 
      message: 'Usuario creado',
      user: { id: user.id, email: user.email, name: user.name }
    }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('=== SIGNUP ERROR ===')
    console.error(error)
    console.error('==================')
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Error al crear usuario: ' + errorMessage }, { status: 500 })
  }
}