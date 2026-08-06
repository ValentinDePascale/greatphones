import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Términos y Condiciones — Great Phones', robots: { index: true, follow: false } }

export default function TerminosPage() {
  return (
    <div className="page-legal">
      <h1 className="page-h1">Términos y Condiciones</h1>
      <p className="page-sub" style={{ marginBottom: 32 }}>Última actualización: Julio 2026</p>
      <div className="legal-s"><h2 className="legal-h2">1. General</h2><p className="legal-p">Estos términos rigen el uso del sitio web y la compra de productos en Great Phones. Al realizar una compra, aceptás estos términos en su totalidad.</p></div>
      <div className="legal-s"><h2 className="legal-h2">2. Productos y Precios</h2><p className="legal-p">Todos los productos son reacondicionados y testeados. Los precios están expresados en pesos argentinos e incluyen IVA.</p></div>
      <div className="legal-s"><h2 className="legal-h2">3. Garantía</h2><p className="legal-p">Todos los equipos incluyen 12 meses de garantía desde la fecha de compra. La garantía cubre defectos de fábrica.</p></div>
      <div className="legal-s"><h2 className="legal-h2">4. Envíos</h2><p className="legal-p">Realizamos envíos a todo el país. Los tiempos de entrega varían según el destino.</p></div>
      <div className="legal-s" style={{ marginBottom: 32 }}><h2 className="legal-h2">5. Devoluciones</h2><p className="legal-p">Disponés de 7 días para devolver tu compra sin costo. El producto debe estar en las mismas condiciones en que fue entregado.</p></div>
      <Link href="/" className="section-link">← Volver al inicio</Link>
    </div>
  )
}
