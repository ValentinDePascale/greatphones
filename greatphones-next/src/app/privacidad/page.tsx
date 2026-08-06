import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Política de Privacidad — Great Phones', robots: { index: true, follow: false } }

export default function PrivacidadPage() {
  return (
    <div className="page-legal">
      <h1 className="page-h1">Política de Privacidad</h1>
      <p className="page-sub" style={{ marginBottom: 32 }}>Última actualización: Julio 2026</p>
      <div className="legal-s"><h2 className="legal-h2">1. Información que recolectamos</h2><p className="legal-p">Recolectamos información que nos proporcionás directamente: nombre, email, teléfono, DNI y dirección de envío al realizar una compra.</p></div>
      <div className="legal-s"><h2 className="legal-h2">2. Uso de la información</h2><p className="legal-p">Usamos tu información para procesar pedidos, enviar confirmaciones y mejorar nuestro servicio. No vendemos ni compartimos tus datos con terceros.</p></div>
      <div className="legal-s"><h2 className="legal-h2">3. Seguridad</h2><p className="legal-p">Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales. Las transacciones se procesan a través de MercadoPago.</p></div>
      <div className="legal-s"><h2 className="legal-h2">4. Cookies</h2><p className="legal-p">Usamos cookies para mantener tu sesión, recordar tu carrito y analizar el tráfico del sitio.</p></div>
      <div className="legal-s" style={{ marginBottom: 32 }}><h2 className="legal-h2">5. Derechos ARCO</h2><p className="legal-p">Tenés derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales. Contactanos a través de nuestro chat o email.</p></div>
      <Link href="/" className="section-link">← Volver al inicio</Link>
    </div>
  )
}
