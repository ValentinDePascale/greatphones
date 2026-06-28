import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const item = await prisma.inventoryItem.findUnique({ where: { code } })
  if (!item) return { title: 'Dispositivo no encontrado' }
  return {
    title: `${item.brand} ${item.modelName} — Great Phones`,
    description: `Ficha técnica de ${item.brand} ${item.modelName}${item.storage ? ' ' + item.storage : ''}${item.color ? ' ' + item.color : ''}`
  }
}

export default async function InvPage({ params }: Props) {
  const { code } = await params
  const item = await prisma.inventoryItem.findUnique({
    where: { code },
    include: {
      product: { select: { name: true, price: true } },
    }
  })

  if (!item) notFound()

  const specs: Record<string, string> = {}
  if (item.storage) specs['Almacenamiento'] = item.storage
  if (item.color) specs['Color'] = item.color
  if (item.modelNumber) specs['Modelo'] = item.modelNumber
  if (item.batteryHealth !== null && item.batteryHealth !== undefined) specs['Batería'] = `${item.batteryHealth}%`
  if (item.cosmeticCondition) specs['Estado estético'] = item.cosmeticCondition
  if (item.functionalCondition) specs['Estado funcional'] = item.functionalCondition
  if (item.serialNumber) specs['N° de serie'] = item.serialNumber
  if (item.deviceType) specs['Tipo'] = item.deviceType

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F0EB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #F5F0EB; }
        .card {
          background: #fff;
          border-radius: 24px;
          max-width: 420px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 12px 48px rgba(0,0,0,.08);
          border: 1px solid #E2DCD3;
        }
        .card-header {
          background: #1A1A2E;
          padding: 1.5rem;
          color: #fff;
          position: relative;
        }
        .card-header::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 0;
          right: 0;
          height: 24px;
          background: #1A1A2E;
          border-radius: 0 0 50% 50%;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .3px;
        }
        .spec-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F0EBE6;
          font-size: 14px;
        }
        .spec-row:last-child { border-bottom: none; }
        .spec-label { color: #888; font-weight: 500; }
        .spec-value { color: #1A1A2E; font-weight: 600; text-align: right; }
        .imei-display {
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
          font-size: 13px;
          background: #F5F0EB;
          padding: 8px 14px;
          border-radius: 10px;
          color: #1A1A2E;
          font-weight: 700;
          word-break: break-all;
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Great Phones</div>
        <div style={{ fontSize: 11, color: '#B0A8A0', marginTop: 4 }}>Ficha técnica del dispositivo</div>
      </div>

      <div className="card">
        <div className="card-header">
          {item.imageUrl && (
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              overflow: 'hidden', marginBottom: 12,
              background: '#2A2A3E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, lineHeight: 1.2 }}>
            {item.brand} {item.modelName}
          </div>
          {item.storage && (
            <div style={{ fontSize: 14, color: '#B0A8A0', fontWeight: 500, marginBottom: 8 }}>
              {item.storage}{item.color ? ` · ${item.color}` : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{
              background: item.status === 'SOLD' ? '#EF4444' : item.status === 'IN_REPAIR' ? '#FF6B2C' : '#22C55E',
              color: '#fff',
            }}>
              {item.status === 'IN_STOCK' ? 'En stock' : item.status === 'SOLD' ? 'Vendido' : item.status === 'IN_REPAIR' ? 'En reparación' : item.status === 'RESERVED' ? 'Reservado' : item.status === 'ON_HOLD' ? 'En espera' : item.status}
            </span>
            <span className="badge" style={{ background: '#EDE6DD', color: '#1A1A2E' }}>
              {item.deviceType}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Especificaciones
          </div>

          <div style={{ background: '#FAF8F6', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
            {Object.entries(specs).map(([label, value]) => (
              <div key={label} className="spec-row">
                <span className="spec-label">{label}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>

          {(item.notes) && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Notas
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, background: '#FAF8F6', padding: '12px 16px', borderRadius: 14, marginBottom: 16 }}>
                {item.notes}
              </div>
            </>
          )}

          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Identificación
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Código</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FF6B2C' }}>{item.code}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>IMEI</div>
              <div className="imei-display">{item.imei}</div>
            </div>
          </div>

          {item.product && (
            <div style={{
              background: '#EDE6DD',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Producto vinculado
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginTop: 2 }}>
                  {item.product.name}
                </div>
              </div>
              {item.targetPrice ? (
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
                  ${item.targetPrice.toLocaleString('es-AR')}
                </div>
              ) : item.product.price ? (
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
                  ${item.product.price.toLocaleString('es-AR')}
                </div>
              ) : null}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#B0A8A0' }}>
            Escaneá este QR desde la caja del dispositivo
          </div>
        </div>
      </div>
    </div>
  )
}
