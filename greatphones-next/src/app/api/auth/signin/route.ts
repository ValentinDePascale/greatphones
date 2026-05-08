import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    // Hardcoded admin for quick access
    if (email === 'admin@greatphones.com' && password === '123456') {
      let user = await prisma.user.findUnique({
        where: { email: 'admin@greatphones.com' }
      })
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('123456', 10)
        user = await prisma.user.create({
          data: {
            email: 'admin@greatphones.com',
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN',
          }
        })
      }
      
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
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
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
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Error al iniciar sesion' }, { status: 500 })
  }
}
