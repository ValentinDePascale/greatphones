import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Garantías y Seguros — Great Phones',
  description: 'Extendé la garantía de tu equipo. Todos los equipos incluyen 12 meses de garantía sin cargo.',
  openGraph: {
    title: 'Garantías y Seguros — Great Phones',
    description: 'Extendé la garantía de tu equipo. Todos los equipos incluyen 12 meses de garantía sin cargo.',
    type: 'website',
  },
}

export default function GarantiasPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        Garantías y seguros
      </h1>
      <p style={{ fontSize: 14, color: '#9A9186', marginBottom: 32 }}>
        Todos los equipos incluyen 12 meses de garantía sin cargo.
      </p>

      <div style={{ background: 'rgba(45,90,39,.06)', border: '1px solid rgba(45,90,39,.15)', borderRadius: 14, padding: '1.5rem', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D5A27', marginBottom: 8 }}>🛡️ 12 meses de garantía incluida</div>
        <p style={{ fontSize: 14, color: '#4A6B3E', lineHeight: 1.6, margin: 0 }}>
          Todos los equipos comprados en Great Phones incluyen 12 meses de garantía sin cargo
          desde la fecha de compra, cubriendo defectos de fábrica y funcionamiento.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #E4DDD4', borderRadius: 14, padding: '1.5rem', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Extendé tu garantía</div>
        <p style={{ fontSize: 13, color: '#6B6259', lineHeight: 1.6, marginBottom: 16 }}>
          Si ya compraste un equipo, podés extender la cobertura hasta 24 meses.
          Solo necesitás tu código de compra e IMEI.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#FDF8F3', borderRadius: 10, padding: 14, border: '1px solid #E4DDD4' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>12 meses cobertura completa</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B2C', fontFamily: "'Playfair Display', serif" }}>$85.000</div>
          </div>
          <div style={{ background: '#FDF8F3', borderRadius: 10, padding: 14, border: '1px solid #E4DDD4' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>24 meses</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B2C', fontFamily: "'Playfair Display', serif" }}>$150.000</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9A9186', textAlign: 'center' }}>
        Para activar la garantía extendida, ingresá a la sección de Garantías en nuestra web con tu código de compra.
      </p>
    </div>
  )
}
