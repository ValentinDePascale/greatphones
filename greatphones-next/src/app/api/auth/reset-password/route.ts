import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, safeKeyPart } from '@/lib/rate-limit'
import { timingSafeEqualString } from '@/lib/crypto'
import { PasswordSchema } from '@/lib/validations'



export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, codigo y nueva contraseña requeridos' }, { status: 400 })
    }

    const pwCheck = PasswordSchema.safeParse(newPassword)
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0]?.message || 'Contraseña inválida' }, { status: 400 })
    }

    const limit = await rateLimit(`reset-pass:${safeKeyPart(email)}`, 5, 60 * 60 * 1000)
    if (!limit.allowed) {
      const mins = Math.ceil((limit.resetAt - Date.now()) / 60000)
      return NextResponse.json({ error: `Demasiados intentos. Espera ${mins} minutos` }, { status: 429 })
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

    if (!timingSafeEqualString(record.code, code)) {
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
