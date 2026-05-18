import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, codigo y nueva contraseña requeridos' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const records = await prisma.passwordReset.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    const record = records[0]
    if (!record) {
      return NextResponse.json({ error: 'Codigo no valido' }, { status: 400 })
    }

    if (record.used) {
      return NextResponse.json({ error: 'Codigo ya usado' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      return NextResponse.json({ error: 'Codigo expirado' }, { status: 400 })
    }

    if (record.code !== code) {
      return NextResponse.json({ error: 'Codigo incorrecto' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true }
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
