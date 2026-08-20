'use client'

import { useEffect, useState } from 'react'

interface PurchasedDevice {
  id: string
  code: string
  quoteId: string
  brand: string
  device: string
  storage: string
  condition: string
  color: string | null
  batteryHealth: number | null
  imei: string | null
  serialNumber: string | null
  clientName: string
  clientDni: string | null
  clientPhone: string | null
  clientCity: string | null
  clientProvince: string | null
  purchasePrice: number
  invoiceId: string
  receivedAt: string
  createdAt: string
  invoice: {
    id: string
    type: string
    number: number
    pos: number
    cae: string | null
    total: number
    createdAt: string
  }
  createdBy: { id: string; name: string; email: string }
}

interface Response {
  data: PurchasedDevice[]
  page: number
  limit: number
  total: number
  totalPages: number
  metrics: { totalSpent: number; avgSpent: number }
}

function fmt(n: number) { return new Intl.NumberFormat('es-AR').format(n) }
function fmtMoney(n: number) { return `$${fmt(n)}` }

export default function PurchasedClient() {
  const [resp, setResp] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PurchasedDevice | null>(null)

  const load = async (p = page, s = search) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (s) params.set('search', s)
      const r = await fetch(`/api/admin/purchased?${params}`, { credentials: 'include' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data: Response = await r.json()
      setResp(data)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, '')
  }, [])

  const onSearch = (v: string) => {
    setSearch(v)
    setPage(1)
    load(1, v)
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: '#ef4444' }}>Error: {error}</div>
    )
  }

  if (!resp) {
    return (
      <div style={{ padding: 32, color: '#64748b' }}>Cargando…</div>
    )
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <header className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <button className="admin-hamburger" onClick={() => { try { (window as any).toggleMobileSidebar && (window as any).toggleMobileSidebar() } catch {} }} aria-label="Abrir menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="admin-topbar-title">Comprados</h1>
        </div>
        <div className="admin-topbar-actions" />
      </header>
      <div className="admin-content" style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Comprados
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Historial de dispositivos comprados a clientes (con factura ARCA)
          </p>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Stat label="Total comprados" value={fmt(resp.total)} />
        <Stat label="Inversión total" value={fmtMoney(resp.metrics.totalSpent)} />
        <Stat label="Precio promedio" value={fmtMoney(resp.metrics.avgSpent)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por código, dispositivo, cliente, DNI o IMEI…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 480,
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            background: '#fff',
          }}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <Th>Código</Th>
              <Th>Dispositivo</Th>
              <Th>Cliente</Th>
              <Th>Condición</Th>
              <Th align="right">Precio</Th>
              <Th>Factura</Th>
              <Th align="right">Fecha</Th>
            </tr>
          </thead>
          <tbody>
            {resp.data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  {loading ? 'Cargando…' : 'Sin dispositivos comprados aún'}
                </td>
              </tr>
            ) : (
              resp.data.map(d => (
                <tr
                  key={d.id}
                  onClick={() => setSelected(d)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <Td style={{ fontFamily: 'monospace' }}>{d.code}</Td>
                  <Td>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{d.device}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {d.brand} · {d.storage} {d.color ? `· ${d.color}` : ''}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ color: '#0f172a' }}>{d.clientName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {d.clientDni || '—'} {d.clientCity ? `· ${d.clientCity}` : ''}
                    </div>
                  </Td>
                  <Td>{d.condition}</Td>
                  <Td align="right" style={{ fontWeight: 600, color: '#0f172a' }}>
                    {fmtMoney(d.purchasePrice)}
                  </Td>
                  <Td>
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                      {d.invoice.type} {d.invoice.pos.toString().padStart(4, '0')}-{d.invoice.number.toString().padStart(8, '0')}
                    </span>
                  </Td>
                  <Td align="right" style={{ color: '#64748b' }}>
                    {new Date(d.receivedAt).toLocaleDateString('es-AR')}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {resp.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid #f1f5f9' }}>
            <button
              disabled={page <= 1}
              onClick={() => { setPage(p => p - 1); load(page - 1) }}
              style={btnStyle(page <= 1)}
            >
              ← Anterior
            </button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: '#64748b' }}>
              Página {page} de {resp.totalPages}
            </span>
            <button
              disabled={page >= resp.totalPages}
              onClick={() => { setPage(p => p + 1); load(page + 1) }}
              style={btnStyle(page >= resp.totalPages)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
      </div>

      {selected && <DetailModal device={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
        {value}
      </div>
    </div>
  )
}

function Th({ children, align = 'left' as 'left' | 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      padding: '10px 14px',
      textAlign: align,
      fontSize: 11,
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {children}
    </th>
  )
}

function Td({ children, style, align = 'left' }: { children: React.ReactNode; style?: React.CSSProperties; align?: 'left' | 'right' }) {
  return (
    <td style={{ padding: '12px 14px', textAlign: align, ...style }}>
      {children}
    </td>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    background: disabled ? '#f1f5f9' : '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    color: disabled ? '#cbd5e1' : '#0f172a',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function DetailModal({ device, onClose }: { device: PurchasedDevice; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: 'min(560px, 95%)',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {device.device}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              {device.code} · Recibido el {new Date(device.receivedAt).toLocaleDateString('es-AR')}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            ×
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Marca" value={device.brand} />
          <Field label="Almacenamiento" value={device.storage} />
          <Field label="Condición" value={device.condition} />
          <Field label="Color" value={device.color || '—'} />
          <Field label="IMEI" value={device.imei || '—'} mono />
          <Field label="Serial" value={device.serialNumber || '—'} mono />
          <Field label="Batería" value={device.batteryHealth != null ? `${device.batteryHealth}%` : '—'} />
          <Field label="Precio compra" value={fmtMoney(device.purchasePrice)} accent />
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Cliente
          </h3>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <div><strong>{device.clientName}</strong></div>
            <div style={{ color: '#64748b', marginTop: 4 }}>
              DNI: {device.clientDni || '—'} · Tel: {device.clientPhone || '—'}
            </div>
            {device.clientCity && (
              <div style={{ color: '#64748b', marginTop: 2 }}>
                {device.clientCity}{device.clientProvince ? `, ${device.clientProvince}` : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Factura ARCA
          </h3>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <div><strong style={{ color: '#065f46' }}>Factura {device.invoice.type}</strong> · {device.invoice.pos.toString().padStart(4, '0')}-{device.invoice.number.toString().padStart(8, '0')}</div>
            {device.invoice.cae && (
              <div style={{ color: '#047857', marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}>
                CAE: {device.invoice.cae}
              </div>
            )}
            <div style={{ color: '#047857', marginTop: 4 }}>
              Total: {fmtMoney(device.invoice.total)} · {new Date(device.invoice.createdAt).toLocaleString('es-AR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        color: accent ? '#FF6B2C' : '#0f172a',
        fontWeight: accent ? 700 : 500,
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value}
      </div>
    </div>
  )
}
