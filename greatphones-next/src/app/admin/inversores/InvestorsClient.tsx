'use client'

import { useEffect, useState } from 'react'

interface Move { id: string; type: string; amount: number; detail: string | null; capitalAfter: number; operator: string | null; createdAt: string }
interface Investor { id: string; name: string; capital: number; paidTotal: number; pending: number; yieldRate: number; movements: Move[] }

const TYPE_LABEL: Record<string, string> = {
  INGRESO_CAPITAL: 'Ingreso de capital', RETIRO_CAPITAL: 'Retiro de capital',
  PAGO_RENDIMIENTO: 'Pago de rendimiento', AJUSTE: 'Ajuste',
}
const TYPE_COLOR: Record<string, string> = {
  INGRESO_CAPITAL: '#0F9D58', RETIRO_CAPITAL: '#DC2626', PAGO_RENDIMIENTO: '#7C3AED', AJUSTE: '#D97706',
}
function fmt(n: number) { return '$' + (n || 0).toLocaleString('es-AR') }

export default function InvestorsClient() {
  const [list, setList] = useState<Investor[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [ncName, setNcName] = useState('')
  const [ncCapital, setNcCapital] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mType, setMType] = useState('INGRESO_CAPITAL')
  const [mAmount, setMAmount] = useState('')
  const [mDetail, setMDetail] = useState('')
  const [yieldMonth, setYieldMonth] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const load = async () => {
    try {
      const r = await fetch('/api/admin/investors', { credentials: 'include' })
      const d = await r.json()
      setList(Array.isArray(d) ? d : [])
    } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const create = async () => {
    const r = await fetch('/api/admin/investors', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', name: ncName, capital: parseInt(ncCapital || '0') || 0 }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', 'Inversor creado')
    setShowCreate(false); setNcName(''); setNcCapital(''); load()
  }

  const move = async () => {
    if (!activeId) return
    const amt = parseInt(mAmount || '0', 10)
    if (!amt) return toast('error', 'Ingresá un monto')
    const r = await fetch('/api/admin/investors', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'move', investorId: activeId, type: mType, amount: amt, detail: mDetail }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', 'Movimiento registrado'); setMAmount(''); setMDetail(''); load()
  }

  const genYield = async () => {
    if (!activeId || !yieldMonth) return toast('error', 'Indicá el mes (YYYY-MM)')
    const r = await fetch('/api/admin/investors', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'yield', investorId: activeId, month: yieldMonth }) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', 'Rendimiento generado'); setYieldMonth(''); load()
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0, fontFamily: 'Manrope,Inter,sans-serif' }}>Inversores</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Cuenta corriente de financistas externos — capital, retiros y rendimiento mensual.</p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} style={{ background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Nuevo inversor</button>
      </div>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? 'linear-gradient(135deg,#0F9D58,#0C8A4C)' : 'linear-gradient(135deg,#DC2626,#B91C1C)' }}>{msg.s}</div>}

      {showCreate && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Nombre</label>
              <input value={ncName} onChange={e => setNcName(e.target.value)} placeholder="Ej: Juan Inversor" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Capital inicial ($)</label>
              <input value={ncCapital} onChange={e => setNcCapital(e.target.value)} type="number" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
            <button onClick={create} style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>Crear</button>
          </div>
        </div>
      )}

      {list.map(inv => (
        <div key={inv.id} style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: '0 1px 2px rgba(23,23,45,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1E9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', fontWeight: 800, fontSize: 16 }}>{inv.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#181B2E' }}>{inv.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Rendimiento {inv.yieldRate}% mensual</div>
              </div>
            </div>
            <button onClick={() => setActiveId(activeId === inv.id ? null : inv.id)} style={{ padding: '8px 14px', border: '1px solid #E6E7F0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>{activeId === inv.id ? 'Cerrar' : 'Gestionar'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <div style={{ background: '#F8F9FC', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Capital invertido</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#181B2E' }}>{fmt(inv.capital)}</div>
            </div>
            <div style={{ background: '#F8F9FC', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Rendimiento pagado</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{fmt(inv.paidTotal)}</div>
            </div>
            <div style={{ background: '#F8F9FC', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Pendiente de pago</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: inv.pending > 0 ? '#D97706' : '#0F9D58' }}>{fmt(inv.pending)}</div>
            </div>
          </div>

          {activeId === inv.id && (
            <div style={{ marginTop: 16, borderTop: '1px solid #EEF0F5', paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Tipo</label>
                  <select value={mType} onChange={e => setMType(e.target.value)} style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Monto ($)</label>
                  <input value={mAmount} onChange={e => setMAmount(e.target.value)} type="number" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Detalle</label>
                  <input value={mDetail} onChange={e => setMDetail(e.target.value)} placeholder="Opcional" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <button onClick={move} style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>Registrar</button>
                  <input value={yieldMonth} onChange={e => setYieldMonth(e.target.value)} placeholder="Rend. YYYY-MM" style={{ padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, flex: 1 }} />
                  <button onClick={genYield} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>Generar</button>
                </div>
              </div>

              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead><tr style={{ background: '#F4F5FA' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Fecha</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Detalle</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Capital post</th>
                  </tr></thead>
                  <tbody>
                    {inv.movements.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #EEF0F5' }}>
                        <td style={{ padding: '7px 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</td>
                        <td style={{ padding: '7px 12px' }}><span style={{ color: '#fff', background: TYPE_COLOR[m.type], padding: '2px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 700 }}>{TYPE_LABEL[m.type]}</span></td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(m.amount)}</td>
                        <td style={{ padding: '7px 12px', color: '#3D4356' }}>{m.detail || '—'}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#6B7280' }}>{fmt(m.capitalAfter)}</td>
                      </tr>
                    ))}
                    {inv.movements.length === 0 && <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#9AA1B2' }}>Sin movimientos</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {list.length === 0 && <div style={{ textAlign: 'center', padding: '50px', color: '#9AA1B2' }}>Aún no hay inversores</div>}
    </div>
  )
}