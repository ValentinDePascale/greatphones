import nodemailer from 'nodemailer';

function escapeHtml(text: unknown): string {
  const s = String(text ?? '')
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return s.replace(/[&<>"']/g, c => map[c])
}

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
  const adminEmail = process.env.EMAIL_USER || 'contacto@greatphones.com.ar';
  
  await sendEmail({
    to: adminEmail,
    subject: `🔔 Nueva solicitud de arrepentimiento - Orden ${data.orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #e65100;">Nueva solicitud de arrepentimiento</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Número de Trámite:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.tramite)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Orden:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.orderCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email del cliente:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.email)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.telefono) || 'No proporcionado'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Motivo:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.motivo) || 'No especificado'}</td>
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
            <td style="padding: 12px;">${escapeHtml(data.tramite)}</td>
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
          ¿Dudas? Escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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
  refundMethod?: string;
  couponCode?: string;
}) {
  const refundInfo = data.refundMethod === 'coupon' ? `
    <p style="background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 16px;">
      <strong>Reembolso por cupon</strong><br>
      Como pagaste en efectivo, recibis un <strong>cupon de devolucion</strong> para usar en tu proxima compra:<br><br>
      <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #d97706; background: #fef3c7; padding: 4px 12px; border-radius: 6px;">${data.couponCode || '—'}</span><br><br>
      <strong>Valor:</strong> $${data.total.toLocaleString('es-AR')}<br>
      <strong>Validez:</strong> 1 ano desde hoy.<br>
      <small>Presenta este codigo en tu proxima compra. No es canjeable por efectivo.</small>
    </p>
  ` : data.refundMethod === 'wallet' ? `
    <p style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-top: 16px;">
      <strong>Reembolso en tu billetera</strong><br>
      Se acreditaron <strong>$${data.total.toLocaleString('es-AR')}</strong> en tu saldo de Great Phones.
    </p>
  ` : data.refundMethod === 'mercadopago' ? `
    <p style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #009EE3; margin-top: 16px;">
      <strong>Reembolso via MercadoPago</strong><br>
      El dinero fue devuelto automaticamente a tu tarjeta o cuenta de MercadoPago por <strong>$${data.total.toLocaleString('es-AR')}</strong>.<br>
      <small>El tiempo de acreditacion depende de tu banco.</small>
    </p>
  ` : data.refundMethod === 'transfer' ? `
    <p style="background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 16px;">
      <strong>Reembolso por transferencia</strong><br>
      Te contactaremos para coordinar la transferencia bancaria por <strong>$${data.total.toLocaleString('es-AR')}</strong>.
    </p>
  ` : ``;

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
        ${data.refundMethod ? refundInfo : ''}
        <h3 style="margin-top: 24px;">Instrucciones para la devolucion:</h3>
        <ol style="line-height: 1.8;">
          <li>El producto debe estar en las mismas condiciones en que fue recibido, con su empaque original.</li>
          <li>Coordina la devolucion respondiendo a este email o visitando nuestro local en <strong>Zelarrayan 179, Bahia Blanca</strong>.</li>
          <li>El costo de envio de la devolucion corre por nuestra cuenta.</li>
          <li>Una vez recibido y verificado el producto, el reembolso se procesara en un maximo de <strong>10 dias habiles</strong>.</li>
        </ol>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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
          <strong>Motivo:</strong> ${escapeHtml(data.reason)}
        </p>
        <p style="margin-top: 20px;">
          Si consideras que esta decision es incorrecta, podes comunicarte con nosotros para revisar tu caso.
          Tenes derecho a reclamar ante la <strong>Defensa del Consumidor</strong> si consideras que se vulneran tus derechos.
        </p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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
  trackingNumber?: string;
  carrier?: string;
}) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
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
          <strong>Metodo de pago:</strong> ${escapeHtml(data.paymentMethod)}<br>
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
        <p style="background: #f5f5f5; padding: 12px; border-radius: 8px;">${escapeHtml(data.shippingAddress) || 'Retiro en tienda'}</p>

        ${data.trackingNumber ? `
        <div style="background: #fff7ed; padding: 16px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0;">
          <strong>Datos de envio:</strong><br>
          <strong>Correo:</strong> ${escapeHtml(data.carrier) || 'Envio'}<br>
          <strong>Numero de seguimiento:</strong> ${escapeHtml(data.trackingNumber)}<br>
          <p style="margin: 8px 0 0; font-size: 13px; color: #666;">Segui tu envio en la seccion "Seguir mi pedido" de nuestra web.</p>
        </div>
        ` : ''}

        <h3 style="margin-top: 24px;">Proximos pasos:</h3>
        <ol style="line-height: 1.8;">
          <li>Estamos preparando tu pedido</li>
          <li>Te contactaremos cuando este listo para envio o retiro</li>
          <li>Tu compra tiene garantia de 12 meses segun Ley 24.240</li>
        </ol>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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
    subject: `Nuevo mensaje de ${escapeHtml(data.userName)} - Great Phones Chat`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Nuevo mensaje en el chat</h2>
        <p>Hola equipo de Great Phones,</p>
        <p>Tienes un nuevo mensaje de <strong>${escapeHtml(data.userName)}</strong> en el chat de soporte.</p>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Tipo:</strong> ${typeLabels[data.conversationType] || escapeHtml(data.conversationType)}<br>
          <strong>Mensaje:</strong> ${escapeHtml(data.messageText.substring(0, 200))}${data.messageText.length > 200 ? '...' : ''}
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
        <p>Hola ${escapeHtml(data.userName)},</p>
        <p>Tienes un nuevo mensaje del administrador en tu conversacion de soporte.</p>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Mensaje:</strong> ${escapeHtml(data.messageText.substring(0, 200))}${data.messageText.length > 200 ? '...' : ''}
        </div>

        <p style="margin-top: 20px;">
          Inicia sesion en Great Phones y abre el chat para ver la conversacion completa y responder.
        </p>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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
        <strong>Numero de tracking:</strong> ${escapeHtml(data.trackingNumber)}<br>
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
        <p>Hola ${escapeHtml(data.userName)},</p>
        <p>El estado de tu pedido <strong>${escapeHtml(data.orderCode)}</strong> ha sido actualizado:</p>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>Nuevo estado:</strong> ${newStatusLabel}
        </div>

        ${trackingHtml}

        <p style="margin-top: 20px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
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

export async function sendPreorderConfirmationEmail(data: {
  email: string;
  clientName: string;
  preOrders: Array<{
    code: string;
    productName: string;
    storage: string;
    color: string;
    price: number;
    availableFrom: Date | null;
  }>;
  paymentMethod: string;
  installments: number;
}) {
  const preOrdersHtml = data.preOrders.map(po => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e5e5;">
        <strong>${escapeHtml(po.productName)}</strong><br>
        <small style="color:#666">${escapeHtml(po.storage)} · ${escapeHtml(po.color)}</small><br>
        <small style="color:#ff6b2c;font-weight:600">Código: ${escapeHtml(po.code)}</small>
      </td>
      <td style="padding:12px;text-align:right;border-bottom:1px solid #e5e5e5;font-weight:700">
        $${po.price.toLocaleString('es-AR')}
      </td>
    </tr>
    ${po.availableFrom ? `
    <tr>
      <td colspan="2" style="padding:8px 12px;font-size:12px;color:#8B7355">
        📅 Disponibilidad estimada: ${new Date(po.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
      </td>
    </tr>` : ''}
  `).join('');

  await sendEmail({
    to: data.email,
    subject: `Confirmación de preventa - Great Phones`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">¡Reserva confirmada!</h2>
        <p>Hola ${escapeHtml(data.clientName)},</p>
        <p>Tu preventa ha sido registrada exitosamente. A continuación los detalles:</p>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <table style="width:100%;border-collapse:collapse">
            ${preOrdersHtml}
          </table>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #ddd">
            <strong>Total abonado:</strong> $${data.preOrders.reduce((sum, po) => sum + po.price, 0).toLocaleString('es-AR')}
            ${data.installments > 1 ? `<br><small>En ${data.installments} cuotas</small>` : ''}
          </div>
        </div>

        <div style="background: #fff3e0; padding: 16px; border-radius: 8px; border-left: 4px solid #ff6b2c; margin: 20px 0;">
          <strong>⚠️ Información importante:</strong>
          <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555">
            <li>Este producto aún <strong>no se encuentra en stock</strong>.</li>
            <li>Las fechas de disponibilidad son <strong>estimadas</strong> y pueden variar.</li>
            <li>Te notificaremos por email cuando el producto esté por llegar.</li>
            <li>No se requiere IMEI hasta que el equipo esté disponible.</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">
          Si tenes alguna duda, escribinos a <a href="mailto:${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}">${process.env.EMAIL_USER || 'contacto@greatphones.com.ar'}</a>
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — El equipo de Great Phones<br>
          Zelarrayan 179, Bahia Blanca
        </p>
      </div>
    `
  });

  return { success: true }
}

export async function sendNewOrderAdminNotification(data: {
  orderCode: string
  clientName: string
  total: number
  itemCount: number
  paymentMethod: string
}) {
  const adminEmail = process.env.EMAIL_USER || 'contacto@greatphones.com.ar'

  await sendEmail({
    to: adminEmail,
    subject: `📦 Nueva venta: ${data.orderCode} — $${data.total.toLocaleString('es-AR')}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #059669;">🎉 Nueva venta confirmada</h2>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
          <strong>Orden:</strong> ${data.orderCode}<br>
          <strong>Cliente:</strong> ${escapeHtml(data.clientName)}<br>
          <strong>Total:</strong> $${data.total.toLocaleString('es-AR')}<br>
          <strong>Productos:</strong> ${data.itemCount}<br>
          <strong>Método de pago:</strong> ${escapeHtml(data.paymentMethod)}
        </div>
        <p style="color: #666; font-size: 12px;">Revisá el pedido en el panel de administración.</p>
      </div>
    `
  })

  return { success: true }
}

export async function sendLowStockAlert(data: {
  productName: string
  stock: number
  productId: string
}) {
  const adminEmail = process.env.EMAIL_USER || 'contacto@greatphones.com.ar'

  await sendEmail({
    to: adminEmail,
    subject: `⚠️ Stock bajo: ${data.productName} (${data.stock} unidades)`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #e65100;">⚠️ Alerta de stock bajo</h2>
        <p>El siguiente producto tiene stock bajo:</p>
        <div style="background: #fff3e0; padding: 16px; border-radius: 8px; border-left: 4px solid #e65100; margin: 20px 0;">
          <strong>Producto:</strong> ${escapeHtml(data.productName)}<br>
          <strong>Stock actual:</strong> ${data.stock} unidades
        </div>
        <p style="color: #666; font-size: 12px;">Revisá el inventario desde el panel de administración.</p>
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
  const adminEmail = process.env.EMAIL_USER || 'contacto@greatphones.com.ar';

  const extrasLabels: Record<string, string> = {
    pant: 'Pantalla perfecta (+6%)',
    bat: 'Bateria 80%+ (+5%)',
    icloud: 'Cuenta libre (+8%)',
    caja: 'Caja original (+3%)',
    acc: 'Accesorios originales (+3%)',
  }

  const extrasHtml = data.extras.length > 0
    ? data.extras.map(e => `<li>${extrasLabels[e] || escapeHtml(e)}</li>`).join('')
    : '<li>Ninguno</li>'

  const photosHtml = data.photos.length > 0
    ? data.photos.map(p => `<img src="${escapeHtml(p)}" style="max-width:200px;margin:8px;border-radius:8px">`).join('')
    : '<p>No se adjuntaron fotos</p>'

  await sendEmail({
    to: adminEmail,
    subject: `Nueva cotizacion: ${data.code} - ${data.device}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ff6b2c;">Nueva cotizacion recibida</h2>
        
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>Codigo:</strong> ${data.code}<br>
          <strong>Dispositivo:</strong> ${escapeHtml(data.device)} ${escapeHtml(data.storage)}<br>
          <strong>Estado:</strong> ${escapeHtml(data.condition)}<br>
          <strong>Precio estimado:</strong> $${data.finalPrice.toLocaleString('es-AR')}
        </div>

        <h3>Extras seleccionados:</h3>
        <ul>${extrasHtml}</ul>

        <h3>Datos del cliente:</h3>
        <p>
          <strong>Nombre:</strong> ${escapeHtml(data.clientName)}<br>
          <strong>Telefono:</strong> ${escapeHtml(data.clientPhone)}<br>
          ${data.clientEmail ? `<strong>Email:</strong> ${escapeHtml(data.clientEmail)}<br>` : ''}
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