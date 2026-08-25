'use client'

import { useCallback, useEffect, useState } from 'react'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }
function fmtP(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }

interface Op { id: string; source: string; operationId: string | null; description: string; category: string | null; type: string; means: string; amount: number; amountUsd?: number | null; opDate: string; operator: string | null }

const SOURCES = ['SALE', 'PREORDER', 'PURCHASE', 'REPAIR', 'GASTO', 'CAMBIO', 'AJUSTE', 'MANUAL', 'ONLINE']
const MEAN_LABEL: Record<string, string> = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', CUOTAS: 'Cuotas', USD: 'USD', PAGO_ONLINE: 'Online' }

export default function MisOperacionesClient() {
  const [rows, setRows] = useState<Op[]>([])
  const [operador, setOperador] = useState('')
  const [source, setSource] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [ver, setVer] = useState<Op | null>(null)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' })
    if (operador) params.set('operador', operador)
    if (source) params.set('source', source)
    if (busqueda) params.set('busqueda', busqueda)
    if (fecha) params.set('fecha', fecha)
    try {
      const r = await fetch('/api/admin/gestion/mis-operaciones?' + params, { credentials: 'include' })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast('error', 'Error al cargar') }
  }, [operador, source, busqueda, fecha])
  useEffect(() => { load() }, [load])

  const verDetalle = async (id: string) => {
    try {
      const r = await fetch('/api/admin/gestion/mis-operaciones?id=' + id, { credentials: 'include' })
      const d = await r.json()
      setVer(d)
    } catch { toast('error', 'Error al cargar detalle') }
  }

  const anular = async (op: Op) => {
    const motivo = prompt('Motivo de la anulación de ' + op.operationId + ':')
    if (motivo === null) return
    if (!motivo.trim()) return toast('error', 'Ingresá un motivo')
    const operador = prompt('¿Quién está anulando?')
    if (!operador) return
    if (!confirm('¿Confirmás anular ' + op.operationId + '?')) return
    const r = await fetch('/api/admin/gestion/mis-operaciones', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operationId: op.operationId, motivo, operador }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', `${d.anulado} anulado (${d.asientos} asientos)`)
    load()
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🗂️ Mis Operaciones</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Movimientos del Libro Diario con filtros</p>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        <div><label style={labelStyle}>Operador</label>
          <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}>
            <option value="">Todos</option>
            {['Martin', 'Maca', 'Sam', 'Eva', 'Buda'].map(o => <option key={o}>{o}</option>)}
          </select></div>
        <div><label style={labelStyle}>Tipo</label>
          <select style={inputStyle} value={source} onChange={e => setSource(e.target.value)}>
            <option value="">Todos</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label style={labelStyle}>Fecha</label>
          <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} /></div>
        <div><label style={labelStyle}>Buscar N°</label>
          <input style={inputStyle} placeholder="Ej: VTA-004" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 14, border: '1px solid #E6E7F0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Fecha</th><th style={{ padding: 8 }}>Tipo</th><th style={{ padding: 8 }}>Número</th>
              <th style={{ padding: 8 }}>Descripción</th><th style={{ padding: 8, textAlign: 'right' }}>Importe</th>
              <th style={{ padding: 8 }}>Operador</th><th style={{ padding: 8 }}>Medio</th><th style={{ padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin operaciones para este filtro.</td></tr>}
            {rows.map(op => (
              <tr key={op.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(op.opDate).toLocaleDateString('es-AR')}</td>
                <td style={{ padding: 8 }}>{op.source}</td>
                <td style={{ padding: 8, fontWeight: 600 }}>{op.operationId || '—'}</td>
                <td style={{ padding: 8 }}>{op.description}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(op.amount)}{op.amountUsd ? ` (US$${op.amountUsd})` : ''}</td>
                <td style={{ padding: 8 }}>{op.operator || '—'}</td>
                <td style={{ padding: 8 }}>{MEAN_LABEL[op.means] || op.means}</td>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                  <button onClick={() => verDetalle(op.id)} style={{ marginRight: 6, padding: '5px 10px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>Ver</button>
                  <button onClick={() => anular(op)} style={{ padding: '5px 10px', background: '#922B21', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>Anular</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 22, maxWidth: 540, width: '92%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: '0 0 12px', color: '#1A5276' }}>{ver.source} — {ver.operationId}</h3>
              <button onClick={() => setVer(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#667' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <b>Tipo:</b> {ver.type}<br />
              <b>Medio:</b> {MEAN_LABEL[ver.means] || ver.means}<br />
              <b>Monto:</b> {fmtP(ver.amount)}{ver.amountUsd ? ` (US$${ver.amountUsd})` : ''}<br />
              <b>Fecha:</b> {new Date(ver.opDate).toLocaleString('es-AR')}<br />
              <b>Operador:</b> {ver.operator || '—'}<br />
              <b>Categoría:</b> {ver.category || '—'}<br />
              <hr />
              <b>Descripción:</b><br />{ver.description}
            </div>
            <button onClick={() => setVer(null)} style={{ marginTop: 14, padding: '8px 16px', background: '#E5E7EB', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}