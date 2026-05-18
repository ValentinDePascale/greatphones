import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

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

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const limit = rateLimit(`forgot:${email}`, 3, 60 * 60 * 1000)
    if (!limit.allowed) {
      const mins = Math.ceil((limit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ error: `Demasiados intentos. Espera ${mins} minutos` }, { status: 429 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'Si el email existe, recibiras un codigo' })
    }

    const code = generateCode()
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.passwordReset.create({
      data: { email, code, expires }
    })

    await sendPasswordResetEmail({ email, code })

    return NextResponse.json({ message: 'Si el email existe, recibiras un codigo' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
