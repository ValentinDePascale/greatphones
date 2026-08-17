import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { rateLimit, safeKeyPart } from '@/lib/rate-limit'
import { timingSafeEqualString } from '@/lib/crypto'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}



export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, email, code } = body

    if (action === 'send') {
      if (!email) {
        return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
      }

      const limit = await rateLimit(`verify:${safeKeyPart(email)}`, 5, 60 * 60 * 1000)
      if (!limit.allowed) {
        const mins = Math.ceil((limit.resetAt - Date.now()) / 60000)
        return NextResponse.json({ error: `Demasiados codigos. Espera ${mins} minutos` }, { status: 429 })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        return NextResponse.json({ error: 'El email ya esta registrado' }, { status: 400 })
      }

      const verifyCode = generateCode()
      const expires = new Date(Date.now() + 2 * 60 * 1000)

      try {
        await prisma.emailVerification.create({
          data: { email, code: verifyCode, expires },
        })
      } catch (dbErr) {
        console.log('[VERIFY] DB create error (ignoring):', dbErr)
      }

      try {
        await sendEmail({
          to: email,
          subject: 'Codigo de verificacion - Great Phones',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #ff6b2c;">Great Phones</h2>
              <p>Tu codigo de verificacion es:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                ${verifyCode}
              </div>
              <p style="color: #666; font-size: 14px;">Este codigo expira en 2 minutos.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('[VERIFY] Email error:', emailErr)
        return NextResponse.json({ error: 'No se pudo enviar el codigo de verificacion' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Codigo enviado' })
    }

    if (action === 'verify') {
      if (!email || !code) {
        return NextResponse.json({ error: 'Email y código requeridos' }, { status: 400 })
      }

      const vfLimit = await rateLimit(`verify-code:${safeKeyPart(email)}`, 10, 15 * 60 * 1000)
      if (!vfLimit.allowed) {
        const mins = Math.ceil((vfLimit.resetAt - Date.now()) / 60000)
        return NextResponse.json({ error: `Demasiados intentos. Espera ${mins} minutos` }, { status: 429 })
      }

      const records = await prisma.emailVerification.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: 1,
      })
      const record = records[0]

      if (!record) {
        return NextResponse.json({ error: 'Código no válido' }, { status: 400 })
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

      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { used: true },
      })

      // Solo actualizar si el usuario ya existe (caso de re-verificacion)
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        await prisma.user.update({
          where: { email },
          data: { verified: true },
        })
      }

      return NextResponse.json({ verified: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
