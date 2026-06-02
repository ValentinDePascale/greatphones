import nodemailer from 'nodemailer';

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null;

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.warn('[EMAIL] Transporter not configured. Skipping email send.');
    return { success: false, error: 'Email not configured' };
  }
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
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendPasswordResetEmail(data: { email: string; code: string }) {
  await sendEmail({
    to: data.email,
    subject: 'Recuperar contraseña - Great Phones',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Recuperar contraseña</h2>
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Tu codigo de verificacion es:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${data.code}
        </div>
        <p style="color: #666; font-size: 14px;">Este codigo expira en 15 minutos.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, ignora este email.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendArrepAcceptEmail(data: {
  orderCode: string;
  email: string;
  total: number;
  shippingAddress: string;
}) {
  await sendEmail({
    to: data.email,
    subject: `Arrepentimiento aceptado - Instrucciones de devolucion - Orden ${data.orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #059669;">Arrepentimiento aceptado</h2>
        <p>Hola,</p>
        <p>Tu solicitud de arrepentimiento para la orden <strong>${data.orderCode}</strong> ha sido <strong>aceptada</strong>.</p>
        <p style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669;">
          <strong>Reembolso total:</strong> $${data.total.toLocaleString('es-AR')}<br>
          <small>Segun Ley 24.240 y Resolucion 424/2020</small>
        </p>
        <h3 style="margin-top: 24px;">Instrucciones para la devolucion:</h3>
        <ol style="line-height: 1.8;">
          <li>El producto debe estar en las mismas condiciones en que fue recibido, con su empaque original.</li>
          <li>Coordina la devolucion respondiendo a este email o visitando nuestro local en <strong>Zelarrayan 179, Bahia Blanca</strong>.</li>
          <li>El costo de envio de la devolucion corre por nuestra cuenta.</li>
          <li>Una vez recibido y verificado el producto, el reembolso se procesara en un maximo de <strong>10 dias habiles</strong>.</li>
        </ol>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendArrepRejectEmail(data: {
  orderCode: string;
  email: string;
  reason: string;
}) {
  await sendEmail({
    to: data.email,
    subject: `Arrepentimiento rechazado - Orden ${data.orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #dc2626;">Solicitud de arrepentimiento rechazada</h2>
        <p>Hola,</p>
        <p>Te informamos que tu solicitud de arrepentimiento para la orden <strong>${data.orderCode}</strong> ha sido <strong>rechazada</strong>.</p>
        <p style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <strong>Motivo:</strong> ${data.reason}
        </p>
        <p style="margin-top: 20px;">
          Si consideras que esta decision es incorrecta, podes comunicarte con nosotros para revisar tu caso.
          Tenes derecho a reclamar ante la <strong>Defensa del Consumidor</strong> si consideras que se vulneran tus derechos.
        </p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendOrderConfirmationEmail(data: {
  orderCode: string;
  email: string;
  phone: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  shippingAddress: string;
  paymentMethod: string;
  installments: number;
}) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  const installmentsText = data.installments > 1 
    ? `${data.installments} cuotas de $${Math.round(data.total / data.installments).toLocaleString('es-AR')}`
    : 'Pago en 1 cuota';

  await sendEmail({
    to: data.email,
    subject: `Confirmacion de compra - Orden ${data.orderCode} - Great Phones`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #059669;">Compra confirmada</h2>
        <p>Hola,</p>
        <p>Tu pago ha sido procesado correctamente. A continuacion los detalles de tu compra:</p>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Orden:</strong> ${data.orderCode}<br>
          <strong>Total pagado:</strong> $${data.total.toLocaleString('es-AR')}<br>
          <strong>Metodo de pago:</strong> ${data.paymentMethod}<br>
          <strong>Cuotas:</strong> ${installmentsText}
        </div>

        <h3 style="margin-top: 24px;">Productos:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h3 style="margin-top: 24px;">Direccion de envio:</h3>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 8px;">${data.shippingAddress || 'Retiro en tienda'}</p>

        <h3 style="margin-top: 24px;">Proximos pasos:</h3>
        <ol style="line-height: 1.8;">
          <li>Estamos preparando tu pedido</li>
          <li>Te contactaremos cuando este listo para envio o retiro</li>
          <li>Tu compra tiene garantia de 90 dias segun Ley 24.240</li>
        </ol>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendNewMessageToAdminEmail(data: {
  adminEmail: string;
  userName: string;
  messageText: string;
  conversationId: string;
  conversationType: string;
}) {
  const typeLabels: Record<string, string> = {
    COMPRA: 'Compra',
    COTIZACION: 'Cotizacion',
    SERVICIO: 'Servicio',
    REPARACION: 'Reparacion',
    GENERIC: 'Consulta'
  }

  await sendEmail({
    to: data.adminEmail,
    subject: `Nuevo mensaje de ${data.userName} - Great Phones Chat`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Nuevo mensaje en el chat</h2>
        <p>Hola equipo de Great Phones,</p>
        <p>Tienes un nuevo mensaje de <strong>${data.userName}</strong> en el chat de soporte.</p>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Tipo:</strong> ${typeLabels[data.conversationType] || data.conversationType}<br>
          <strong>Mensaje:</strong> ${data.messageText.substring(0, 200)}${data.messageText.length > 200 ? '...' : ''}
        </div>

        <p style="margin-top: 20px;">
          Responde desde el panel de administracion para mantener la conversacion actualizada.
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendAdminReplyEmail(data: {
  userEmail: string;
  userName: string;
  adminName: string;
  messageText: string;
  conversationId: string;
}) {
  await sendEmail({
    to: data.userEmail,
    subject: `Tienes un nuevo mensaje del administrador - Great Phones`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Nuevo mensaje del administrador</h2>
        <p>Hola ${data.userName},</p>
        <p>Tienes un nuevo mensaje del administrador en tu conversacion de soporte.</p>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Mensaje:</strong> ${data.messageText.substring(0, 200)}${data.messageText.length > 200 ? '...' : ''}
        </div>

        <p style="margin-top: 20px;">
          Inicia sesion en Great Phones y abre el chat para ver la conversacion completa y responder.
        </p>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true };
}

export async function sendOrderStatusEmail(data: {
  email: string;
  userName: string;
  orderCode: string;
  oldStatus: string;
  newStatus: string;
  trackingNumber?: string;
}) {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    PROCESSING: 'En proceso',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }

  const newStatusLabel = statusLabels[data.newStatus] || data.newStatus

  let trackingHtml = ''
  if (data.trackingNumber && data.newStatus === 'SHIPPED') {
    trackingHtml = `
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
        <strong>Numero de tracking:</strong> ${data.trackingNumber}<br>
        <small>Podes seguir tu envio con este codigo</small>
      </div>
    `
  }

  await sendEmail({
    to: data.email,
    subject: `Tu pedido ${data.orderCode} cambio de estado - Great Phones`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Actualizacion de tu pedido</h2>
        <p>Hola ${data.userName},</p>
        <p>El estado de tu pedido <strong>${data.orderCode}</strong> ha sido actualizado:</p>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>Nuevo estado:</strong> ${newStatusLabel}
        </div>

        ${trackingHtml}

        <p style="margin-top: 20px;">
          Si tenes alguna duda, escribinos a <a href="mailto:contacto@greatphones.com.ar">contacto@greatphones.com.ar</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  })

  return { success: true }
}

export async function sendNewQuoteEmail(data: {
  code: string;
  device: string;
  storage: string;
  condition: string;
  finalPrice: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  photos: string[];
  extras: string[];
}) {
  const adminEmail = 'contacto@greatphones.com.ar'

  const extrasLabels: Record<string, string> = {
    pant: 'Pantalla perfecta (+6%)',
    bat: 'Bateria 80%+ (+5%)',
    icloud: 'Cuenta libre (+8%)',
    caja: 'Caja original (+3%)',
    acc: 'Accesorios originales (+3%)',
  }

  const extrasHtml = data.extras.length > 0
    ? data.extras.map(e => `<li>${extrasLabels[e] || e}</li>`).join('')
    : '<li>Ninguno</li>'

  const photosHtml = data.photos.length > 0
    ? data.photos.map(p => `<img src="${p}" style="max-width:200px;margin:8px;border-radius:8px">`).join('')
    : '<p>No se adjuntaron fotos</p>'

  await sendEmail({
    to: adminEmail,
    subject: `Nueva cotizacion: ${data.code} - ${data.device}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Nueva cotizacion recibida</h2>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>Codigo:</strong> ${data.code}<br>
          <strong>Dispositivo:</strong> ${data.device} ${data.storage}<br>
          <strong>Estado:</strong> ${data.condition}<br>
          <strong>Precio estimado:</strong> $${data.finalPrice.toLocaleString('es-AR')}
        </div>

        <h3>Extras seleccionados:</h3>
        <ul>${extrasHtml}</ul>

        <h3>Datos del cliente:</h3>
        <p>
          <strong>Nombre:</strong> ${data.clientName}<br>
          <strong>Telefono:</strong> ${data.clientPhone}<br>
          ${data.clientEmail ? `<strong>Email:</strong> ${data.clientEmail}<br>` : ''}
        </p>

        <h3>Fotos del dispositivo:</h3>
        <div>${photosHtml}</div>

        <p style="margin-top: 30px;">
          Revisa la cotizacion en el panel de administracion y acepta o rechaza segun corresponda.
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  })

  return { success: true }
}