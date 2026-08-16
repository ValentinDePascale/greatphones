// ============ SIGNUP API ============
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignupSchema, formatZodError } from '@/lib/validations'
import { rateLimit, safeKeyPart } from '@/lib/rate-limit'
import { createSessionCookie } from '@/lib/session'



export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const validation = SignupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 })
    }
    
    const { email, name, phone, dni, provincia, ciudad, password } = body

    const limit = await rateLimit(`signup:${safeKeyPart(email)}`, 3, 60 * 60 * 1000)
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
        verified: false,
      }
    })

    const cookie = createSessionCookie(user.id, user.role)

    return NextResponse.json({ 
      message: 'Usuario creado',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        dni: user.dni,
        provincia: user.provincia,
        ciudad: user.ciudad,
        role: user.role,
        hasPassword: true,
      }
    }, { 
      status: 201,
      headers: {
        'Set-Cookie': cookie,
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
