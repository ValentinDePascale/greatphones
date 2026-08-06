import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Great Phones',
  robots: { index: true, follow: false },
}

export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.7, color: '#1a1a1a' }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        Política de Privacidad
      </h1>
      <p style={{ fontSize: 13, color: '#9A9186', marginBottom: 32 }}>Última actualización: Julio 2026</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>1. Información que recolectamos</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Recolectamos información que nos proporcionás directamente: nombre, email, teléfono, DNI y dirección
          de envío al realizar una compra. También recolectamos datos de navegación de forma anónima.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>2. Uso de la información</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Usamos tu información para procesar pedidos, enviar confirmaciones, mejorar nuestro servicio
          y cumplir con obligaciones legales. No vendemos ni compartimos tus datos con terceros.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>3. Seguridad</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales.
          Las transacciones se procesan a través de MercadoPago, que cumple con estándares PCI DSS.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>4. Cookies</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Usamos cookies para mantener tu sesión, recordar tu carrito y analizar el tráfico del sitio.
          Podés deshabilitar las cookies en la configuración de tu navegador.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>5. Derechos ARCO</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Tenés derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales.
          Para ejercer estos derechos, contactanos a través de nuestro chat o email.
        </p>
      </section>

      <Link href="/" style={{ fontSize: 14, color: '#FF6B2C', fontWeight: 600, textDecoration: 'none' }}>
        ← Volver al inicio
      </Link>
    </div>
  )
}
