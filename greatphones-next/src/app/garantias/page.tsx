import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Garantías — Great Phones',
  description: 'Extendé la garantía de tu equipo. 12 meses de garantía incluida.',
  openGraph: { title: 'Garantías — Great Phones', description: 'Extendé la garantía de tu equipo.', type: 'website' },
}

export default function GarantiasPage() {
  return (
    <div className="page-sm">
      <h1 className="page-h1">Garantías y seguros</h1>
      <p className="page-sub">Todos los equipos incluyen 12 meses de garantía sin cargo.</p>

      <div className="gar-card">
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D5A27', marginBottom: 8 }}>🛡️ 12 meses de garantía incluida</div>
        <p style={{ fontSize: 14, color: '#4A6B3E', lineHeight: 1.6, margin: 0 }}>Todos los equipos comprados en Great Phones incluyen 12 meses de garantía sin cargo desde la fecha de compra, cubriendo defectos de fábrica y funcionamiento.</p>
      </div>

      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Extendé tu garantía</div>
        <p style={{ fontSize: 13, color: '#6B6259', lineHeight: 1.6, marginBottom: 16 }}>Si ya compraste un equipo, podés extender la cobertura hasta 24 meses con tu código de compra e IMEI.</p>
        <div className="gar-grid">
          <div className="gar-plan">
            <div className="gar-plan-t">12 meses cobertura completa</div>
            <div className="gar-price">$85.000</div>
          </div>
          <div className="gar-plan">
            <div className="gar-plan-t">24 meses</div>
            <div className="gar-price">$150.000</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>Para activar la garantía extendida, ingresá a la sección de Garantías con tu código de compra.</p>
    </div>
  )
}
