import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSession(request)
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseña actual y nueva son requeridas' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'La nueva contraseña debe ser diferente a la actual' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser?.password) {
      return NextResponse.json({ error: 'Tu cuenta usa Google. No hay contraseña que cambiar.' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!valid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 })
  }
}
