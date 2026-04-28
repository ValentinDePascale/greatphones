import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from: `"Great Phones" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Error sending:', error);
    return { success: false, error };
  }
}

export async function sendArrepentimientoEmail(data: {
  orderCode: string;
  email: string;
  telefono?: string;
  motivo?: string;
  tramite: string;
}) {
  const adminEmail = 'contacto@greatphones.com.ar';
  
  await sendEmail({
    to: adminEmail,
    subject: `🔔 Nueva solicitud de arrepentimiento - Orden ${data.orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #e65100;">Nueva solicitud de arrepentimiento</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Número de Trámite:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.tramite}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Orden:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.orderCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email del cliente:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.telefono || 'No proporcionado'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Motivo:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.motivo || 'No especificado'}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Esta solicitud fue generada automáticamente por el sistema de Great Phones.
          Según Resolución 424/2020, el plazo para procesar es de 3 días hábiles.
        </p>
      </div>
    `
  });

  await sendEmail({
    to: data.email,
    subject: `Tu solicitud de arrepentimiento ha sido registrada - Great Phones`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #e65100;">Solicitud de arrepentimiento registrada</h2>
        <p>Hola,</p>
        <p>Tu solicitud de arrepentimiento ha sido registrada correctamente. A continuación los detalles:</p>
        <table style="width: 100%; border-collapse: collapse; background: #f5f5f5;">
          <tr>
            <td style="padding: 12px;"><strong>Número de Trámite:</strong></td>
            <td style="padding: 12px;">${data.tramite}</td>
          </tr>
          <tr>
            <td style="padding: 12px;"><strong>Orden:</strong></td>
            <td style="padding: 12px;">${data.orderCode}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          Nuestro equipo revisará tu solicitud y te contactará en un máximo de <strong>3 días hábiles</strong> 
          para gestionar el reembolso según lo establece la Resolución 424/2020.
        </p>
        <p style="margin-top: 20px;">
          ¿Dudas? Escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahía Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}