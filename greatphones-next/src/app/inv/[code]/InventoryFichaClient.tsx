'use client'

import { useState } from 'react'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  IN_STOCK: { label: 'En stock', color: '#22c55e' },
  IN_REPAIR: { label: 'En reparación', color: '#f59e0b' },
  RESERVED: { label: 'Reservado', color: '#3b82f6' },
  ON_HOLD: { label: 'En espera', color: '#8b5cf6' },
  SOLD: { label: 'Vendido', color: '#ef4444' },
}

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: '#6b7280' }
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatCurrency(n: number | null) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('es-AR')
}

const HISTORY_ICONS: Record<string, string> = {
  CREATED: '📦',
  STATUS_CHANGE: '🔄',
  REPAIR: '🔧',
  SOLD: '💰',
  LABEL_PRINTED: '🏷️',
  NOTE: '📝',
}

export default function InventoryFichaClient({ item, session }: any) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')

  if (!item) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Dispositivo no encontrado</h2>
        <p style={{ color: '#6b7280' }}>El código no corresponde a ningún dispositivo en el inventario.</p>
      </div>
    )
  }

  const statusInfo = getStatusInfo(item.status)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f0', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{ background: '#0E0B07', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#FF6B2C', fontWeight: 800, fontSize: 18 }}>Great Phones</span>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>Inventario</span>
        </div>
        <a href="/admin" style={{ color: '#FF6B2C', fontSize: 13, textDecoration: 'none' }}>← Volver al panel</a>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#0E0B07' }}>{item.code}</span>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600, color: '#fff',
                  background: statusInfo.color
                }}>{statusInfo.label}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0E0B07' }}>
                {item.brand} {item.modelName}
              </h1>
              {item.storage && <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{item.storage}{item.color ? ` — ${item.color}` : ''}</div>}
            </div>
            {item.qrCode && (
              <div style={{ textAlign: 'center' }}>
                <img src={item.qrCode} alt="QR" style={{ width: 120, height: 120 }} />
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Código QR</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => window.open(item.qrCode)} style={btnStyle('#FF6B2C', '#fff')}>
              📷 Descargar QR
            </button>
            <button onClick={() => window.print()} style={btnStyle('#fff', '#0E0B07', '1px solid #d1d5db')}>
              🖨️ Imprimir etiqueta
            </button>
            {item.status !== 'SOLD' && (
              <button onClick={() => alert('Venta: pronto disponible')} style={btnStyle('#22c55e', '#fff')}>
                💰 Vender
              </button>
            )}
            <button onClick={() => alert('Editar: pronto disponible')} style={btnStyle('#fff', '#0E0B07', '1px solid #d1d5db')}>
              ✏️ Editar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              ...tabBtnStyle,
              background: activeTab === 'info' ? '#FF6B2C' : '#fff',
              color: activeTab === 'info' ? '#fff' : '#6b7280',
            }}
          >Información</button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              ...tabBtnStyle,
              background: activeTab === 'history' ? '#FF6B2C' : '#fff',
              color: activeTab === 'history' ? '#fff' : '#6b7280',
            }}
          >Historial ({item.history?.length || 0})</button>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Device Info */}
            <Card title="Datos del dispositivo">
              <Row label="Marca" value={item.brand} />
              <Row label="Modelo" value={item.modelName} />
              <Row label="IMEI" value={item.imei} />
              <Row label="N° Serie" value={item.serialNumber} />
              <Row label="N° Modelo" value={item.modelNumber} />
              <Row label="Capacidad" value={item.storage} />
              <Row label="Color" value={item.color} />
              <Row label="Tipo" value={item.deviceType} />
            </Card>

            {/* Business Info */}
            <Card title="Datos del negocio">
              <Row label="Precio compra" value={formatCurrency(item.purchasePrice)} />
              <Row label="Precio target" value={formatCurrency(item.targetPrice)} />
              <Row label="Precio venta" value={formatCurrency(item.salePrice)} highlight />
              <Row label="Proveedor" value={item.supplier?.name || item.purchasedFrom} />
              <Row label="Condición estética" value={item.cosmeticCondition} />
              <Row label="Condición funcional" value={item.functionalCondition} />
              <Row label="Batería" value={item.batteryHealth != null ? `${item.batteryHealth}%` : '—'} />
              <Row label="Inversor" value={item.investor} />
              <Row label="Observaciones" value={item.notes} />
            </Card>

            {/* Tracking */}
            <Card title="Tracking">
              <Row label="Código" value={item.code} />
              <Row label="Estado" value={statusInfo.label} />
              <Row label="Vinculado a" value={item.product ? `${item.product.name} (stock: ${item.product.stock})` : '—'} />
              <Row label="Creado por" value={item.createdBy?.name} />
              <Row label="Fecha de carga" value={formatDate(item.createdAt)} />
              {item.soldBy && <Row label="Vendido por" value={item.soldBy.name} />}
              {item.soldAt && <Row label="Fecha de venta" value={formatDate(item.soldAt)} />}
            </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card title="Línea de tiempo">
            {(!item.history || item.history.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                Sin historial disponible
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {item.history.map((h: any, i: number) => (
                  <div key={h.id} style={{ display: 'flex', gap: 12, paddingBottom: i < item.history.length - 1 ? 20 : 0, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#f3f4f6', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 14, zIndex: 1
                      }}>
                        {HISTORY_ICONS[h.type] || '📌'}
                      </div>
                      {i < item.history.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{h.description}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{formatDate(h.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .label-print, .label-print * { visibility: visible; }
          .label-print { position: absolute; left: 0; top: 0; width: 40mm; height: 60mm; padding: 2mm; }
        }
      `}</style>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0E0B07', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? '#FF6B2C' : '#0E0B07' }}>{value}</span>
    </div>
  )
}

function btnStyle(bg: string, color: string, border?: string): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 10, border: border || 'none',
    background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'opacity .15s',
  }
}

const tabBtnStyle: React.CSSProperties = {
  padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #e5e7eb', borderBottom: 'none',
  borderRadius: '10px 10px 0 0', transition: 'all .15s',
}
