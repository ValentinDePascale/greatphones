'use client'

import { useCallback, useEffect, useState } from 'react'

interface Repair {
  id: string; code: string; device: string; issue: string; type: string | null
  clientName: string | null; jobs: string[]; status: string
  diagnosisStatus: string | null; priceCalc: number | null; pricePaid: number | null
  isDiagnosis: boolean | null; deliveredAt: string | null; operator: string | null; createdAt: string
}
interface Resp { data: Repair[]; total: number; page: number; totalPages: number }

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En ingreso', DIAGNOSIS: 'En diagnóstico', APPROVED: 'Presupuesto aceptado',
  IN_PROGRESS: 'En reparación', COMPLETED: 'Reparado', DELIVERED: 'Retirado',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#6B7280', DIAGNOSIS: '#D97706', APPROVED: '#2563EB',
  IN_PROGRESS: '#7C3AED', COMPLETED: '#0F9D58', DELIVERED: '#181B2E',
}
function fmt(n: number | null | undefined) { return '$' + (n || 0).toLocaleString('es-AR') }

export default function RepairsClient() {
  const [list, setList] = useState<Repair[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('all')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [showNew, setShowNew] = useState(false)
  // form nuevo
  const [ndevice, setNdevice] = useState('')
  const [nissue, setNissue] = useState('')
  const [nclient, setNclient] = useState('')
  const [ntype, setNtype] = useState('particular')
  const [freemode, setFreemode] = useState(false) // free flow

  const post = useCallback(async (body: any) => {
    const r = await fetch('/api/admin/repairs', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { ok: r.ok, data: await r.json() }
  }, [])

  const load = useCallback(async (p = page, s = status) => {
    const q = new URLSearchParams({ page: String(p), limit: '30' })
    if (s && s !== 'all') q.set('status', s)
    const r = await fetch(`/api/admin/repairs?${q}`, { credentials: 'include' })
    const d: Resp = await r.json()
    setList(d.data || []); setTotal(d.total); setTotalPages(d.totalPages || 1); setPage(d.page || 1)
  }, [])

  useEffect(() => { load(1, 'all') }, [load])

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const create = async () => {
    if (!ndevice || !nissue) return toast('error', 'Equipo y falla son obligatorios')
    const r = await post({ action: 'create', data: { device: ndevice, issue: nissue, type: ntype, clientName: nclient } })
    if (!r.ok) return toast('error', r.data.error || 'Error')
    toast('success', `Reparación ${r.data.code} creada`)
    setShowNew(false); setNdevice(''); setNissue(''); setNclient('')
    load(1, status)
  }

  const advance = async (id: string, body: any) => {
    const r = await post({ action: 'update', data: { id, ...body } })
    if (!r.ok) return toast('error', r.data.error || 'Error')
    toast('success', 'Actualizado'); load(page, status)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0, fontFamily: 'Manrope,Inter,sans-serif' }}>Reparaciones</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Ciclo ingreso → diagnóstico → presupuesto → reparación → retiro</p>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ background: 'linear-gradient(135deg,#B45309,#D97706)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Nueva reparación</button>
      </div>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? 'linear-gradient(135deg,#0F9D58,#0C8A4C)' : 'linear-gradient(135deg,#DC2626,#B91C1C)' }}>{msg.s}</div>}

      {showNew && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Tipo</label>
              <select value={ntype} onChange={e => setNtype(e.target.value)} style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }}>
                <option value="particular">Particular</option><option value="garantia">Garantía</option><option value="preventa">Preventa</option><option value="interno">Interno</option>
              </select></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Equipo *</label>
              <input value={ndevice} onChange={e => setNdevice(e.target.value)} placeholder="iPhone 14" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Falla *</label>
              <input value={nissue} onChange={e => setNissue(e.target.value)} placeholder="Pantalla rota" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Cliente</label>
              <input value={nclient} onChange={e => setNclient(e.target.value)} placeholder="Opcional" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13 }} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3D4356' }}>
            <input type="checkbox" checked={freemode} onChange={e => setFreemode(e.target.checked)} /> Es diagnóstico (Previo/derivado de reparación)
          </label></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={create} style={{ background: '#B45309', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Crear</button>
            <button onClick={() => setShowNew(false)} style={{ background: '#EEEFF5', color: '#333', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'Todas'], ['PENDING', 'En ingreso'], ['DIAGNOSIS', 'Diagnóstico'], ['IN_PROGRESS', 'En reparación'], ['COMPLETED', 'Reparado'], ['DELIVERED', 'Retirado']].map(([k, v]) => (
          <button key={k} onClick={() => { setStatus(k); load(1, k) }}
            style={{ padding: '8px 14px', borderRadius: 100, border: '1px solid #E6E7F0', background: status === k ? '#1A5276' : '#fff', color: status === k ? '#fff' : '#3D4356', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>{v}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#1A5276', color: '#fff' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Código</th>
            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Equipo</th>
            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Falla</th>
            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Cliente</th>
            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Precio</th>
            <th style={{ padding: '10px 14px', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Acciones</th>
          </tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #EEF0F5' }}>
                <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.code}</td>
                <td style={{ padding: '9px 14px', fontWeight: 600 }}>{r.device}</td>
                <td style={{ padding: '9px 14px', color: '#3D4356' }}>{r.issue}{r.clientName ? ' · ' + r.clientName : ''}</td>
                <td style={{ padding: '9px 14px', color: '#6B7280' }}>{r.clientName || '—'}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700 }}>{fmt(r.pricePaid || r.priceCalc)}</td>
                <td style={{ padding: '9px 14px' }}>
                  <span style={{ color: '#fff', background: STATUS_COLOR[r.status], padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{STATUS_LABEL[r.status]}</span>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {r.status === 'DIAGNOSIS' && (
                    <button onClick={() => advance(r.id, { diagnosisStatus: 'ACEPTADO', status: 'APPROVED', operator: '' })} style={{ padding: '6px 10px', border: 'none', borderRadius: 8, background: '#0F9D58', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>Aceptar</button>
                  )}
                  {r.status === 'PENDING' && (
                    <button onClick={() => advance(r.id, { status: 'IN_PROGRESS' })} style={{ padding: '6px 10px', border: 'none', borderRadius: 8, background: '#7C3AED', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>Reparar</button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button onClick={() => advance(r.id, { status: 'COMPLETED' })} style={{ padding: '6px 10px', border: 'none', borderRadius: 8, background: '#2563EB', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>Completar</button>
                  )}
                  {r.status === 'COMPLETED' && (
                    <button onClick={() => advance(r.id, { status: 'DELIVERED', pricePaid: r.priceCalc })}
                      style={{ padding: '6px 10px', border: 'none', borderRadius: 8, background: '#181B2E', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>Entregar + cobrar</button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#9AA1B2' }}>Sin reparaciones</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px', fontSize: 13, color: '#6B7280' }}>
        <span>{total} reparaciones</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding: '7px 14px', border: '1px solid #E6E7F0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>← Anterior</button>
          <span>Pág {page} de {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} style={{ padding: '7px 14px', border: '1px solid #E6E7F0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Siguiente →</button>
        </span>
      </div>
    </div>
  )
}