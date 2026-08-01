import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'
import { createSessionCookie, clearSessionCookie } from '@/lib/session'



export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    const limit = await rateLimit(`signin:${email}`, 5, 15 * 60 * 1000)
    if (!limit.allowed) {
      const mins = Math.ceil((limit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ error: `Demasiados intentos. Espera ${mins} minutos` }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Email o password incorrectos' }, { status: 401 })
    }

    if (!user.verified) {
      return NextResponse.json({ error: 'Debes verificar tu email antes de iniciar sesión', needsVerification: true }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: 'Email o password incorrectos' }, { status: 401 })
    }

    const cookie = createSessionCookie(user.id, user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        dni: user.dni,
        direccion: user.direccion,
        piso: user.piso,
        cp: user.cp,
        provincia: user.provincia,
        ciudad: user.ciudad,
        role: user.role,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
        'Set-Cookie': cookie,
      }
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Error al iniciar sesion' }, { status: 500 })
  }
}
