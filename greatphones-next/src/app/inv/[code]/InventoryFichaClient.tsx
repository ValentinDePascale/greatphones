'use client'

import { useState, useRef } from 'react'

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
  CREATED: '📦', STATUS_CHANGE: '🔄', REPAIR: '🔧',
  SOLD: '💰', LABEL_PRINTED: '🏷️', NOTE: '📝',
}

function downloadQR(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function InventoryFichaClient({ item, session }: any) {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'label'>('info')
  const labelRef = useRef<HTMLDivElement>(null)

  if (!item) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Dispositivo no encontrado</h2>
        <p style={{ color: '#6b7280' }}>El código no corresponde a ningún dispositivo en el inventario.</p>
      </div>
    )
  }

  const statusInfo = getStatusInfo(item.status)

  function handlePrintLabel() {
    setActiveTab('label')
    setTimeout(() => {
      const labelEl = labelRef.current
      if (labelEl) {
        const printWindow = window.open('', '_blank')
        if (!printWindow) { window.print(); return }
        printWindow.document.write(`
          <html>
          <head>
            <title>Etiqueta ${item.code}</title>
            <style>
              @page { margin: 0; size: 40mm 60mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                width: 40mm; height: 60mm;
                font-family: 'Courier New', monospace;
                display: flex; align-items: center; justify-content: center;
              }
              .label {
                width: 40mm; height: 60mm;
                padding: 2mm;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                text-align: center;
                gap: 1.5mm;
              }
              .label img { width: 18mm; height: 18mm; image-rendering: pixelated; }
              .label .code { font-size: 8pt; font-weight: bold; letter-spacing: 0.5mm; }
              .label .name { font-size: 7pt; font-weight: bold; }
              .label .detail { font-size: 6pt; color: #555; }
              .label .imei { font-size: 5pt; color: #888; word-break: break-all; }
              .label .battery { font-size: 6pt; }
              .label .price { font-size: 7pt; font-weight: bold; }
              .label .divider { width: 80%; height: 0.5px; background: #ccc; }
            </style>
          </head>
          <body>
            <div class="label">
              <img src="${item.qrCode}" alt="QR" />
              <div class="code">${item.code}</div>
              <div class="name">${item.brand} ${item.modelName}</div>
              <div class="detail">${[item.storage, item.color].filter(Boolean).join(' — ') || ''}</div>
              <div class="divider"></div>
              ${item.batteryHealth != null ? `<div class="battery">🔋 ${item.batteryHealth}%</div>` : ''}
              <div class="imei">${item.imei}</div>
              <div class="detail">${item.cosmeticCondition}</div>
              <div class="price">${formatCurrency(item.targetPrice || item.purchasePrice)}</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
    }, 100)
  }

  const labelPreview = (
    <div ref={labelRef} style={{
      width: 160, height: 240,
      background: '#fff', borderRadius: 8,
      border: '2px solid #e5e7eb',
      padding: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 4,
      fontFamily: "'Courier New', monospace",
      fontSize: 10,
      margin: '0 auto',
    }}>
      {item.qrCode && (
        <img src={item.qrCode} alt="QR" style={{ width: 72, height: 72, imageRendering: 'pixelated' }} />
      )}
      <div style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }}>{item.code}</div>
      <div style={{ fontSize: 8, fontWeight: 'bold', color: '#0E0B07' }}>{item.brand} {item.modelName}</div>
      <div style={{ fontSize: 7, color: '#6b7280' }}>{[item.storage, item.color].filter(Boolean).join(' — ')}</div>
      <div style={{ width: '80%', height: 1, background: '#e5e7eb' }} />
      {item.batteryHealth != null && (
        <div style={{ fontSize: 7 }}>🔋 {item.batteryHealth}%</div>
      )}
      <div style={{ fontSize: 6, color: '#9ca3af', wordBreak: 'break-all' }}>{item.imei}</div>
      <div style={{ fontSize: 7, color: '#6b7280' }}>{item.cosmeticCondition}</div>
      <div style={{ fontSize: 8, fontWeight: 'bold', color: '#FF6B2C' }}>
        {formatCurrency(item.targetPrice || item.purchasePrice)}
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f0', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{ background: '#0E0B07', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#FF6B2C', fontWeight: 800, fontSize: 18 }}>Great Phones</span>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>Inventario</span>
        </div>
        <a href="/" style={{ color: '#FF6B2C', fontSize: 13, textDecoration: 'none' }}>← Volver al panel</a>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#0E0B07' }}>{item.code}</span>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#fff', background: statusInfo.color }}>{statusInfo.label}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0E0B07' }}>
                {item.brand} {item.modelName}
              </h1>
              {item.storage && <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{item.storage}{item.color ? ` — ${item.color}` : ''}</div>}
            </div>
            {item.qrCode && (
              <div style={{ textAlign: 'center' }}>
                <img src={item.qrCode} alt="QR" style={{ width: 100, height: 100 }} />
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{item.code}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => downloadQR(item.qrCode, `QR-${item.code}.png`)} style={btnStyle('#FF6B2C', '#fff')}>
              📷 Descargar QR
            </button>
            <button onClick={handlePrintLabel} style={btnStyle('#fff', '#0E0B07', '1px solid #d1d5db')}>
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
          {([
            { key: 'info', label: 'Información' },
            { key: 'history', label: `Historial (${item.history?.length || 0})` },
            { key: 'label', label: 'Etiqueta' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              ...tabBtnStyle,
              background: activeTab === t.key ? '#FF6B2C' : '#fff',
              color: activeTab === t.key ? '#fff' : '#6b7280',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gap: 16 }}>
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
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Sin historial disponible</div>
            ) : (
              <div style={{ position: 'relative' }}>
                {item.history.map((h: any, i: number) => (
                  <div key={h.id} style={{ display: 'flex', gap: 12, paddingBottom: i < item.history.length - 1 ? 20 : 0, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, zIndex: 1 }}>
                        {HISTORY_ICONS[h.type] || '📌'}
                      </div>
                      {i < item.history.length - 1 && <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
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

        {/* Label Tab */}
        {activeTab === 'label' && (
          <Card title="Vista previa de etiqueta">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '1rem 0' }}>
              <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                Tamaño real: 4cm × 6cm. Usá el botón <strong>Imprimir etiqueta</strong> para imprimir en una impresora térmica.
              </div>
              <div style={{
                width: 160, padding: 8,
                background: '#fff', borderRadius: 8,
                border: '2px solid #d1d5db',
                boxShadow: '0 4px 20px rgba(0,0,0,.1)',
                display: 'flex', justifyContent: 'center',
              }}>
                {labelPreview}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => downloadQR(item.qrCode, `QR-${item.code}.png`)} style={btnStyle('#FF6B2C', '#fff')}>
                  📷 Descargar QR
                </button>
                <button onClick={handlePrintLabel} style={btnStyle('#fff', '#0E0B07', '1px solid #d1d5db')}>
                  🖨️ Imprimir etiqueta
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
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
