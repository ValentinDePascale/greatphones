'use client'

import { useEffect, useState } from 'react'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
function fmtP(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }

interface Comision { operador: string; cantidadVentas: number; facturacion: number; ganancia: number; preventas: number; reparaciones: number; totalMovimientos: number }

function today() { return new Date().toISOString().split('T')[0] }

export default function ComisionesClient() {
  const [rows, setRows] = useState<Comision[]>([])
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const q = params.toString()
    try {
      const r = await fetch('/api/admin/gestion/comisiones' + (q ? '?' + q : ''), { credentials: 'include' })
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setMsg({ t: 'error', s: 'Error al cargar' }) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>💼 Comisiones</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Indicadores por operador (base para definir comisiones)</p>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, color: '#fff', fontWeight: 600, fontSize: 13, background: '#DC2626' }}>{msg.s}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap', marginTop: 12 }}>
        <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }}>Desde</label>
          <input type="date" style={inputStyle} value={desde} onChange={e => setDesde(e.target.value)} /></div>
        <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }}>Hasta</label>
          <input type="date" style={inputStyle} value={hasta} onChange={e => setHasta(e.target.value)} /></div>
        <button onClick={load} style={{ padding: '10px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Filtrar</button>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 14, border: '1px solid #E6E7F0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Operador</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Cant. ventas</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Facturación</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Ganancia</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Preventas</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Reparaciones</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Movimientos</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center', color: '#889' }}>Sin datos.</td></tr>}
            {rows.map(r => (
              <tr key={r.operador} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{r.operador}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.cantidadVentas}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(r.facturacion)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{fmtP(r.ganancia)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.preventas}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.reparaciones}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.totalMovimientos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}