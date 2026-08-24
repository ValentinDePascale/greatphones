'use client'

import { useCallback, useEffect, useState } from 'react'

interface Audit {
  id: string; entityType: string; entityId: string; action: string
  reason: string | null; operator: string | null; createdAt: string
}
interface Resp { data: Audit[]; total: number; page: number; totalPages: number }

const ACTION_LABEL: Record<string, string> = {
  ANULACION: 'Anulación', RESTAURACION: 'Restauración', CORRECCION: 'Corrección',
  CREACION: 'Creación', UPDATE: 'Actualización',
}
const ACTION_COLOR: Record<string, string> = {
  ANULACION: '#DC2626', RESTAURACION: '#0F9D58', CORRECCION: '#D97706',
  CREACION: '#2563EB', UPDATE: '#6B7280',
}

export default function AuditClient() {
  const [data, setData] = useState<Audit[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [entityType, setEntityType] = useState('')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  // anular
  const [showAnular, setShowAnular] = useState(false)
  const [aType, setAType] = useState('Product')
  const [aId, setAId] = useState('')
  const [aReason, setAReason] = useState('')
  const [operators, setOperators] = useState<{ name: string }[]>([])

  const load = useCallback(async (p = page, e = entityType, s = search) => {
    const q = new URLSearchParams({ page: String(p), limit: '50' })
    if (e) q.set('entityType', e)
    if (s) q.set('search', s)
    try {
      const r = await fetch(`/api/admin/audit?${q}`, { credentials: 'include' })
      const d: Resp = await r.json()
      setData(d.data || []); setTotal(d.total); setTotalPages(d.totalPages || 1); setPage(d.page || 1)
    } catch { setMsg({ t: 'error', s: 'Error al cargar auditoría' }) }
  }, [])

  useEffect(() => { load(1, '', '') }, [load])
  useEffect(() => {
    fetch('/api/admin/operators', { credentials: 'include' })
      .then(r => r.json()).then(d => setOperators(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const anularSubmit = async () => {
    if (!aReason.trim()) return setMsg({ t: 'error', s: 'El motivo es obligatorio' })
    const r = await fetch('/api/admin/audit', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entityType: aType, entityId: aId, reason: aReason }) })
    const d = await r.json()
    if (!r.ok) return setMsg({ t: 'error', s: d.error || 'Error al anular' })
    setMsg({ t: 'success', s: 'Operación anulada correctamente' })
    setShowAnular(false); setAId(''); setAReason('')
    load(1, entityType, search)
    setTimeout(() => setMsg(null), 4000)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0, fontFamily: 'Manrope,Inter,sans-serif' }}>Auditoría</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Historial de anulaciones, restauraciones y cambios. Nunca se borra información.</p>
        </div>
        <button onClick={() => setShowAnular(v => !v)} style={{ background: 'linear-gradient(135deg,#DC2626,#B91C1C)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Anular operación
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? 'linear-gradient(135deg,#0F9D58,#0C8A4C)' : 'linear-gradient(135deg,#DC2626,#B91C1C)' }}>{msg.s}</div>
      )}

      {showAnular && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 20, marginBottom: 26 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#181B2E' }}>Anular operación</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Entidad</label>
              <select value={aType} onChange={e => setAType(e.target.value)} style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }}>
                {['Product', 'Accessory', 'Order', 'Repair', 'Quote', 'PreOrder'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>ID de la operación</label>
              <input value={aId} onChange={e => setAId(e.target.value)} placeholder="id o código" style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 5 }}>Motivo (obligatorio)</label>
            <input value={aReason} onChange={e => setAReason(e.target.value)} placeholder="Ej: Precio incorrecto, cliente canceló..." style={{ width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={anularSubmit} style={{ background: 'linear-gradient(135deg,#DC2626,#B91C1C)', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Confirmar anulación</button>
            <button onClick={() => setShowAnular(false)} style={{ background: '#EEEFF5', color: '#333', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); load(1, entityType, e.target.value) }} placeholder="Buscar por ID, motivo u operador..." style={{ flex: 1, minWidth: 200, padding: 10, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#fff' }} />
        <select value={entityType} onChange={e => { setEntityType(e.target.value); load(1, e.target.value, search) }} style={{ padding: 10, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#fff' }}>
          <option value="">Todas las entidades</option>
          {['Product', 'Accessory', 'Order', 'Repair', 'Quote', 'PreOrder'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1A5276', color: '#fff' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Entidad</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Acción</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Motivo</th>
              <th style={{ padding: '10px 14px', textAlign: 'left' }}>Operador</th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #EEF0F5' }}>
                <td style={{ padding: '9px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: '9px 14px', fontWeight: 600 }}>{a.entityType}</td>
                <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 12 }}>{a.entityId}</td>
                <td style={{ padding: '9px 14px' }}>
                  <span style={{ color: '#fff', background: ACTION_COLOR[a.action] || '#6B7280', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                    {ACTION_LABEL[a.action] || a.action}
                  </span>
                </td>
                <td style={{ padding: '9px 14px', color: '#3D4356' }}>{a.reason || '—'}</td>
                <td style={{ padding: '9px 14px', color: '#6B7280' }}>{a.operator || '—'}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#9AA1B2' }}>Sin eventos de auditoría</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px', fontSize: 13, color: '#6B7280' }}>
        <span>{total} eventos</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding: '7px 14px', border: '1px solid #E6E7F0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>← Anterior</button>
          <span>Pág {page} de {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} style={{ padding: '7px 14px', border: '1px solid #E6E7F0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Siguiente →</button>
        </span>
      </div>
    </div>
  )
}