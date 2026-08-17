import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, handleRouteError } from '@/lib/auth-guard'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request)

    const body = await request.json()
    const amount = Math.floor(Number(body?.amount))

    if (!amount || amount <= 0 || isNaN(amount)) {
      return NextResponse.json({ error: 'Ingresá un monto válido' }, { status: 400 })
    }
    if (amount < 1000) {
      return NextResponse.json({ error: 'El monto mínimo para retirar es $1.000' }, { status: 400 })
    }

    const result = await prisma.$transaction(async tx => {
      // Lock wallet row
      const walletRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "Wallet" WHERE "userId" = $1 FOR UPDATE',
        user.id,
      )
      let wallet: any
      if (!walletRows || walletRows.length === 0) {
        throw { status: 400, message: 'No tenés saldo para retirar' }
      }
      wallet = await tx.wallet.findUnique({ where: { id: walletRows[0].id } })

      if (!wallet || wallet.balance < amount) {
        throw { status: 400, message: 'Saldo insuficiente' }
      }

      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore - amount

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      })

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: -amount,
          balanceBefore,
          balanceAfter,
          description: 'Retiro por transferencia',
        },
      })

      return { walletId: wallet.id, balanceAfter }
    })

    // Notificar al equipo para procesar la transferencia.
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } })
      const userName = dbUser?.name || dbUser?.email || user.email
      const adminEmail = process.env.EMAIL_USER || 'contacto@greatphones.com.ar'
      await sendEmail({
        to: adminEmail,
        subject: `🏧 Solicitud de retiro — ${userName} — $${amount.toLocaleString('es-AR')}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #ff6b2c;">Solicitud de retiro de saldo</h2>
            <table style="width: 100%; border-collapse: collapse; background: #f5f5f5;">
              <tr><td style="padding: 12px;"><strong>Usuario:</strong></td><td style="padding: 12px;">${userName} (${user.email})</td></tr>
              <tr><td style="padding: 12px;"><strong>Monto a transferir:</strong></td><td style="padding: 12px;">$${amount.toLocaleString('es-AR')}</td></tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">Contactá al usuario para coordinar la transferencia bancaria.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[WITHDRAW] Error notificando al admin:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: `Retiro de $${amount.toLocaleString('es-AR')} registrado. Nos contactaremos para transferirte.`,
      balance: result.balanceAfter,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}