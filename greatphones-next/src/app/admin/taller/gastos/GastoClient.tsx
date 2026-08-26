'use client'

import { useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
const CATEGORIAS = ['Alquiler', 'Sueldos', 'Servicios', 'Repuestos', 'Publicidad', 'Transporte', 'Comida', 'Impuestos', 'Mantenimiento', 'Otros']
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

export default function GastoClient() {
  const [operador, setOperador] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [cat, setCat] = useState('Otros')
  const [desc, setDesc] = useState('')
  const [montoGasto, setMontoGasto] = useState(0)
  const [efec, setEfec] = useState(0)
  const [transf, setTransf] = useState(0)
  const [usd, setUsd] = useState(0)
  const [resp, setResp] = useState('Martin')
  const [comp, setComp] = useState('')
  const [obs, setObs] = useState('')
  const [cotizacion, setCotizacion] = useState(0)
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }

  useEffect(() => {
    fetch('/api/admin/precios/dolar?tipo=blue', { credentials: 'include' }).then(r => r.json()).then(d => { if (d && d.venta) setCotizacion(d.venta) }).catch(() => {})
  }, [])

  const usdEnPesos = Math.round(usd * cotizacion)
  const total = efec + transf + usdEnPesos

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!desc.trim()) return toast('error', 'Ingresá una descripción')
    if (total <= 0) return toast('error', 'El monto total debe ser > 0')
    if (montoGasto > 0 && Math.abs(total - montoGasto) > 1) return toast('error', `El total pagado (${fmtARS(total)}) no coincide con el monto del gasto (${fmtARS(montoGasto)})`)

    try {
      const r = await fetch('/api/admin/taller/gastos', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha, cat, desc: desc.trim(), efec, transf, usd, resp, comp, obs: obs.trim(), operador }) })
      const d = await r.json()
      if (!r.ok) return toast('error', d.error || 'Error')
      toast('success', `Gasto registrado — ${d.operacion} · Total ${fmtARS(d.montoTotal)}`)
      setDesc(''); setMontoGasto(0); setEfec(0); setTransf(0); setUsd(0); setObs('')
    } catch { toast('error', 'Error al registrar') }
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>💸 Registrar Gasto</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Registrar un egreso de caja (efectivo / transferencia / USD)</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>1 · ¿Quién y cuándo?</div>
        <label style={labelStyle}>Operador: *</label>
        <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}>
          <option value="" disabled>Seleccionar...</option>
          {OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <label style={labelStyle}>Fecha:</label>
        <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} />

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>2 · ¿Qué gasto es?</div>
          <label style={labelStyle}>Categoría:</label>
          <select style={inputStyle} value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={labelStyle}>Descripción: *</label>
          <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalle del gasto" />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>3 · ¿Cuánto y cómo se pagó?</div>
          <label style={labelStyle}>Monto total del gasto ($) — opcional, solo para verificar:</label>
          <input type="number" min={0} style={inputStyle} value={montoGasto} onChange={e => setMontoGasto(Number(e.target.value))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Monto efectivo ($):</label>
              <input type="number" min={0} style={inputStyle} value={efec} onChange={e => setEfec(Number(e.target.value))} /></div>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Monto transferencia ($):</label>
              <input type="number" min={0} style={inputStyle} value={transf} onChange={e => setTransf(Number(e.target.value))} /></div>
          </div>
          <label style={labelStyle}>Monto USD (dólares):</label>
          <input type="number" min={0} style={inputStyle} value={usd} onChange={e => setUsd(Number(e.target.value))} />
          <div style={{ fontSize: 11, color: '#667', marginTop: 3 }}>
            {cotizacion ? `Cotización USD (blue): ${fmtARS(cotizacion)}` : 'Cargando cotización...'}
          </div>
          <div style={{ background: '#F4F6F9', borderRadius: 8, padding: 12, marginTop: 10, fontWeight: 700, fontSize: 14 }}>
            Total pagado: {fmtARS(total)}{usd > 0 ? ` (incluye ${usd} USD ≈ ${fmtARS(usdEnPesos)})` : ''}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>4 · Datos adicionales (opcional)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>Responsable:</label>
              <input style={inputStyle} value={resp} onChange={e => setResp(e.target.value)} /></div>
            <div><label style={{ ...labelStyle, marginTop: 0 }}>N° Comprobante:</label>
              <input style={inputStyle} value={comp} onChange={e => setComp(e.target.value)} placeholder="Ej: FC-0001" /></div>
          </div>
          <label style={labelStyle}>Observaciones:</label>
          <input style={inputStyle} value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" />
        </div>

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#B91C1C,#DC2626)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Registrar gasto</button>
      </div>
    </div>
  )
}
