import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'
import { PasswordSchema } from '@/lib/validations'
import { timingSafeEqualString } from '@/lib/crypto'
import bcrypt from 'bcryptjs'

// Cambio de contraseña seguro: requiere un código de verificación enviado por
// email (generado por /api/auth/forgot-password). No se pide la contraseña actual.
export async function PUT(request: NextRequest) {
  try {
    const user = await requireSession(request)
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, código y nueva contraseña son requeridos' }, { status: 400 })
    }
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'El email no coincide con tu cuenta' }, { status: 400 })
    }

    const pwCheck = PasswordSchema.safeParse(newPassword)
    if (!pwCheck.success) {
      return NextResponse.json({ error: pwCheck.error.issues[0]?.message || 'Contraseña inválida' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser?.password) {
      return NextResponse.json({ error: 'Tu cuenta usa Google. No hay contraseña que cambiar.' }, { status: 400 })
    }

    const records = await prisma.passwordReset.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })
    const record = records[0]

    if (!record) {
      return NextResponse.json({ error: 'Pedí un código primero' }, { status: 400 })
    }
    if (record.used) {
      return NextResponse.json({ error: 'Código ya usado' }, { status: 400 })
    }
    if (record.expires < new Date()) {
      return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
    }
    if (!timingSafeEqualString(record.code, code)) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })
    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 })
  }
}