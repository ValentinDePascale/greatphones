'use client'

import { useCallback, useEffect, useState } from 'react'

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
function fmt(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

export default function PreventasClient() {
  const [operador, setOperador] = useState('')
  const [vendedor, setVendedor] = useState('Martin')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [modelo, setModelo] = useState('')
  const [cliente, setCliente] = useState('')
  const [cuil, setCuil] = useState('')
  const [tel, setTel] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [efec, setEfec] = useState('')
  const [transf, setTransf] = useState('')
  const [cuotas, setCuotas] = useState('')
  const [usd, setUsd] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  useEffect(() => {
    // Plazo 7-10 días hábiles aprox (simplificado)
    const d = new Date(); const h = new Date();
    setFechaDesde(new Date(d.setDate(d.getDate() + 7)).toISOString().split('T')[0])
    setFechaHasta(new Date(h.setDate(h.getDate() + 10)).toISOString().split('T')[0])
  }, [])

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }
  const tot = (parseInt(efec) || 0) + (parseInt(transf) || 0) + (parseInt(cuotas) || 0) + Math.round((parseInt(usd) || 0) * 1000)

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!cliente.trim()) return toast('error', 'Ingresá el nombre del cliente')
    if (!modelo.trim()) return toast('error', 'Ingresá el modelo solicitado')
    if (!vendedor.trim()) return toast('error', 'Ingresá el nombre del vendedor')
    if (!precioVenta || +precioVenta <= 0) return toast('error', 'El precio pactado debe ser > 0')
    if (tot <= 0) return toast('error', 'Debe registrarse al menos un cobro')

    const r = await fetch('/api/admin/ops/preventas', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha, modelo, cliente, cuil, tel, vendedor, precioVenta: +precioVenta, efectivo: parseInt(efec) || 0, transferencia: parseInt(transf) || 0, cuotas: parseInt(cuotas) || 0, usd: parseInt(usd) || 0, fechaDesde, fechaHasta, obs, operador }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', `Preventa registrada — ${d.numero}`)
    setModelo(''); setCliente(''); setCuil(''); setTel(''); setPrecioVenta(''); setEfec(''); setTransf(''); setCuotas(''); setUsd(''); setObs('')
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🟡 Registrar Preventa</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Reserva sin stock: cobro anticipado y entrega futura</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E' }}>1 · ¿Quién toma el pedido y cuándo?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>Operador: *</label>
            <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}><option value="" disabled>Seleccionar...</option>{OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
          <div><label style={labelStyle}>Vendedor: *</label>
            <input style={inputStyle} value={vendedor} onChange={e => setVendedor(e.target.value)} /></div>
        </div>
        <label style={labelStyle}>Fecha preventa:</label>
        <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} />

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>2 · ¿Qué pidió el cliente?</div>
        <label style={labelStyle}>Modelo solicitado: *</label>
        <input style={inputStyle} value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Buscar modelo..." />
        <label style={labelStyle}>Cliente: *</label>
        <input style={inputStyle} value={cliente} onChange={e => setCliente(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>CUIL (opcional):</label><input style={inputStyle} value={cuil} onChange={e => setCuil(e.target.value)} /></div>
          <div><label style={{ ...labelStyle, marginTop: 0 }}>Teléfono:</label><input style={inputStyle} value={tel} onChange={e => setTel(e.target.value)} /></div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>3 · Plazo de entrega (7-10 días hábiles)</div>
        <div style={{ background: '#EEF3FE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: 12, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ ...labelStyle, marginTop: 0, fontSize: 11 }}>Fecha Prometida Desde</label><input type="date" style={inputStyle} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} /></div>
            <div><label style={{ ...labelStyle, marginTop: 0, fontSize: 11 }}>Fecha Prometida Hasta</label><input type="date" style={inputStyle} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} /></div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>4 · Precio y cobro</div>
        <label style={labelStyle}>Precio de venta pactado ($): *</label>
        <input type="number" style={inputStyle} value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} />
        <label style={labelStyle}>Cobrado en ($):</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[['Efectivo', efec, setEfec], ['Transferencia', transf, setTransf], ['Cuotas', cuotas, setCuotas], ['USD', usd, setUsd]].map(([lab, val, set], i) => (
            <div key={i}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#3D4356' }}>{lab as string}</label>
              <input type="number" style={{ ...inputStyle, padding: 8 }} value={val as string} onChange={e => (set as any)(e.target.value)} /></div>
          ))}
        </div>
        <div style={{ background: '#D5F5E3', padding: '12px 14px', borderRadius: 10, marginTop: 10, fontWeight: 700 }}>Total cobrado: {fmt(tot)}</div>

        <label style={labelStyle}>Observaciones:</label>
        <input style={inputStyle} value={obs} onChange={e => setObs(e.target.value)} />

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🟡 Registrar preventa</button>
      </div>
    </div>
  )
}