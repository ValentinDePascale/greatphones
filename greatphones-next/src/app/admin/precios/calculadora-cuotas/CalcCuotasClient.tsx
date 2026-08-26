'use client'

import { useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'

interface CuotaRow {
  id: string
  cuotas: number
  coeficiente: number
  activo: boolean
  mostrar: boolean
  observacion?: string | null
}

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }

export default function CalcCuotasClient() {
  const [rows, setRows] = useState<CuotaRow[]>([])
  const [monto, setMonto] = useState('')
  const [resultado, setResultado] = useState<Array<{ cuotas: number; total: number; valorCuota: number }>>([])
  const [calculado, setCalculado] = useState(false)

  useEffect(() => {
    fetch('/api/admin/precios/cuotas', { credentials: 'include' }).then(r => r.json()).then(d => setRows(Array.isArray(d) ? d.filter(c => c.mostrar && c.activo) : [])).catch(() => {})
  }, [])

  const calcular = () => {
    const m = Number(monto) || 0
    if (m <= 0) { setResultado([]); setCalculado(false); return }
    const res = rows.map(c => {
      const total = Math.round(m * c.coeficiente)
      return { cuotas: c.cuotas, total, valorCuota: Math.round(total / c.cuotas) }
    })
    setResultado(res)
    setCalculado(true)
  }

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>💳 Calculadora de Cuotas</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Coeficientes editables desde la sección de Precios</p>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, marginTop: 14, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356' }}>Monto ($):</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="number" min={0} style={inputStyle} value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" />
          <button onClick={calcular} style={{ background: '#7C3AED', color: '#fff', padding: '0 20px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Calcular</button>
        </div>

        {calculado && (
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {resultado.length === 0 && <div style={{ textAlign: 'center', color: '#889', padding: 16 }}>No hay coeficientes configurados.</div>}
            {resultado.map(r => (
              <div key={r.cuotas} style={{ background: '#F8F9FA', border: '1px solid #E6E7F0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>{r.cuotas === 1 ? '1 pago' : `${r.cuotas} cuotas`}</div>
                <div style={{ fontSize: 13, color: '#334' }}>
                  {r.cuotas === 1 ? `Total: ${fmtARS(r.total)}` : `${r.cuotas} x ${fmtARS(r.valorCuota)}<br/>Total: ${fmtARS(r.total)}`.replace('<br/>', ' · ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
