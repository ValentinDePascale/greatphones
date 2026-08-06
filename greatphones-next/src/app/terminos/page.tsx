import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Great Phones',
  robots: { index: true, follow: false },
}

export default function TerminosPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.7, color: '#1a1a1a' }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        Términos y Condiciones
      </h1>
      <p style={{ fontSize: 13, color: '#9A9186', marginBottom: 32 }}>Última actualización: Julio 2026</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>1. General</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Estos términos rigen el uso del sitio web y la compra de productos en Great Phones.
          Al realizar una compra, aceptás estos términos en su totalidad.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>2. Productos y Precios</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Todos los productos son reacondicionados y testeados. Los precios están expresados en pesos argentinos
          e incluyen IVA. Great Phones se reserva el derecho de modificar precios sin previo aviso.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>3. Garantía</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Todos los equipos incluyen 12 meses de garantía desde la fecha de compra.
          La garantía cubre defectos de fábrica. No cubre daños por mal uso, golpes, líquidos o intervención de terceros.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>4. Envíos</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Realizamos envíos a todo el país. Los tiempos de entrega varían según el destino.
          El comprador es responsable de proporcionar una dirección de entrega correcta.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>5. Devoluciones</h2>
        <p style={{ fontSize: 14, color: '#6B6259' }}>
          Disponés de 7 días para devolver tu compra sin costo.
          El producto debe estar en las mismas condiciones en que fue entregado.
        </p>
      </section>

      <Link href="/" style={{ fontSize: 14, color: '#FF6B2C', fontWeight: 600, textDecoration: 'none' }}>
        ← Volver al inicio
      </Link>
    </div>
  )
}
