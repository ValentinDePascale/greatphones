import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { requireAdmin } from '@/lib/auth-guard'

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const { email, pdfBase64, orderCode } = await request.json()

    if (!email || !pdfBase64) {
      return NextResponse.json({ error: 'Faltan datos (email o PDF)' }, { status: 400 })
    }

    if (!transporter) {
      return NextResponse.json({ error: 'Email no configurado' }, { status: 500 })
    }

    // Extract base64 data from data URI
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')

    await transporter.sendMail({
      from: `"Great Phones" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Recibo de Venta ${orderCode || ''} - GreatPhones`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px">
          <h2 style="color:#FF6B2C">GreatPhones</h2>
          <p>Te enviamos el recibo de tu compra.</p>
          <p><strong>Nº de orden:</strong> ${orderCode || 'N/A'}</p>
          <p>El recibo se encuentra adjunto a este mail.</p>
          <hr style="border:1px solid #eee;margin:20px 0">
          <p style="font-size:12px;color:#888">GreatPhones · Zelarrayan 179, Bahía Blanca · 2914727351</p>
        </div>
      `,
      attachments: [{
        filename: `Recibo_${orderCode || 'venta'}.pdf`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'application/pdf'
      }]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending receipt email:', error)
    return NextResponse.json({ error: 'Error al enviar el mail' }, { status: 500 })
  }
}
