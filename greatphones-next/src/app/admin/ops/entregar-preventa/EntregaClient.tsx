'use client'

import { useCallback, useEffect, useState } from 'react'

interface PreEntrega { id: string; code: string; clientName: string; productModelName: string | null; price: number; saldo?: number; status: string }

const OPERADORES = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']
function fmt(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }
const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

export default function EntregaClient() {
  const [operador, setOperador] = useState('')
  const [preorders, setPreorders] = useState<PreEntrega[]>([])
  const [nPre, setNPre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [efec, setEfec] = useState('')
  const [transf, setTransf] = useState('')
  const [cuotas, setCuotas] = useState('')
  const [usd, setUsd] = useState('')
  const [obs, setObs] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/ops/entregar-preventa', { credentials: 'include' }); const d = await r.json(); setPreorders(Array.isArray(d) ? d : []) } catch {}
  }, [])
  useEffect(() => { load() }, [load])

  const sel = preorders.find(p => p.id === nPre)
  const saldo = sel ? (sel.saldo ?? sel.price) : 0
  const totalIngresado = (parseInt(efec) || 0) + (parseInt(transf) || 0) + (parseInt(cuotas) || 0) + Math.round((parseInt(usd) || 0) * 1000)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 5000) }

  const enviar = async () => {
    if (!operador) return toast('error', 'Seleccioná el operador')
    if (!nPre) return toast('error', 'Seleccioná una preventa')
    if (totalIngresado > saldo + 1) return toast('error', `Lo que cobrás ahora (${fmt(totalIngresado)}) supera el saldo (${fmt(saldo)})`)

    const r = await fetch('/api/admin/ops/entregar-preventa', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preOrderId: nPre, fecha, efectivo: parseInt(efec) || 0, transferencia: parseInt(transf) || 0, cuotas: parseInt(cuotas) || 0, usd: parseInt(usd) || 0, obs, operador }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', `Entrega registrada — ${d.preventa}`)
    setNPre(''); setEfec(''); setTransf(''); setCuotas(''); setUsd(''); setObs(''); load()
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>📦 Entregar Preventa</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Cobro del saldo pendiente y entrega del equipo</p>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E' }}>1 · ¿Quién entrega y qué preventa?</div>
        <label style={labelStyle}>Operador: *</label>
        <select style={inputStyle} value={operador} onChange={e => setOperador(e.target.value)}><option value="" disabled>Seleccionar...</option>{OPERADORES.map(o => <option key={o} value={o}>{o}</option>)}</select>
        <label style={labelStyle}>Preventa a entregar: *</label>
        <select style={inputStyle} value={nPre} onChange={e => setNPre(e.target.value)}>
          <option value="">Seleccionar preventa...</option>
          {preorders.map(p => <option key={p.id} value={p.id}>{p.code} — {p.productModelName || ''} → {p.clientName} [{p.status}]</option>)}
        </select>

        {sel && (
          <div style={{ background: '#EEF3FE', borderLeft: '4px solid #2563EB', borderRadius: 8, padding: 12, marginTop: 10, fontSize: 13 }}>
            <b>Cliente:</b> {sel.clientName}<br />
            <b>Modelo:</b> {sel.productModelName}<br />
            <b>Precio pactado:</b> {fmt(sel.price)}<br />
            <b>Saldo pendiente:</b> {fmt(saldo)}
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>2 · Cobro del saldo</div>
        <div style={{ background: '#FEF6E7', borderLeft: '4px solid #D97706', borderRadius: 8, padding: 12, marginTop: 10 }}>
          <label style={{ marginTop: 0, color: '#7D6608' }}>Cobrar ahora (saldo pendiente):</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
            {[['Efectivo', efec, setEfec], ['Transferencia', transf, setTransf], ['Cuotas', cuotas, setCuotas], ['USD', usd, setUsd]].map(([lab, val, set], i) => (
              <div key={i}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#3D4356' }}>{lab as string}</label>
                <input type="number" style={{ ...inputStyle, padding: 8 }} value={val as string} onChange={e => (set as any)(e.target.value)} /></div>
            ))}
          </div>
          <div style={{ background: '#FEF9E7', padding: '12px 14px', borderRadius: 10, marginTop: 10, fontWeight: 700 }}>Total ingresado: {fmt(totalIngresado)}</div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E', marginTop: 20 }}>3 · Fecha y observaciones</div>
        <label style={labelStyle}>Fecha de entrega:</label>
        <input type="date" style={inputStyle} value={fecha} onChange={e => setFecha(e.target.value)} />
        <label style={labelStyle}>Observaciones (opcional):</label>
        <input style={inputStyle} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ej: entregado en local" />

        <button onClick={enviar} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#8E44AD,#A569BD)', color: '#fff', padding: 12, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Confirmar entrega</button>
      </div>
    </div>
  )
}