'use client'

import { useCallback, useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'

interface TomaRow {
  id: string
  modelo: string
  impecable: number
  bateria: number
  pantalla: number
  camara: number
  microfono: number
  parlante: number
  tapa: number
  marco: number
  pin: number
}

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

const FALLAS: Array<'bateria' | 'pantalla' | 'camara' | 'microfono' | 'parlante' | 'tapa' | 'marco' | 'pin'> = ['bateria', 'pantalla', 'camara', 'microfono', 'parlante', 'tapa', 'marco', 'pin']

export default function TomaEditor() {
  const [rows, setRows] = useState<TomaRow[]>([])
  const [buscar, setBuscar] = useState('')
  const [edit, setEdit] = useState<TomaRow | null>(null)
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const empty = { modelo: '', impecable: 0, bateria: 0, pantalla: 0, camara: 0, microfono: 0, parlante: 0, tapa: 0, marco: 0, pin: 0 }
  const [form, setForm] = useState<typeof empty>(empty)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/precios/toma', { credentials: 'include' }); const d = await r.json(); setRows(Array.isArray(d) ? d : []) } catch { toast('error', 'Error al cargar') }
  }, [])
  useEffect(() => { load() }, [load])

  const filtrados = rows.filter(r => !buscar || (r.modelo || '').toLowerCase().includes(buscar.toLowerCase()))
  const set = (key: keyof typeof form, val: any) => setForm({ ...form, [key]: val })

  const startNuevo = () => { setEdit(null); setForm(empty) }
  const startEdit = (r: TomaRow) => { setEdit(r); setForm({ ...r }) }

  const guardar = async () => {
    if (!form.modelo.trim()) return toast('error', 'El modelo es obligatorio')
    const payload = { ...form, impecable: Number(form.impecable) || 0 }
    FALLAS.forEach(k => { payload[k] = Number(form[k]) || 0 })
    const r = await fetch('/api/admin/precios/toma', {
      method: edit ? 'PATCH' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit ? { id: edit.id, ...payload } : payload),
    })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', edit ? 'Actualizado' : 'Creado')
    setEdit(null); setForm(empty); load()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este modelo?')) return
    const r = await fetch(`/api/admin/precios/toma?id=${id}`, { method: 'DELETE', credentials: 'include' })
    if (!r.ok) { const d = await r.json(); return toast('error', d.error || 'Error') }
    toast('success', 'Eliminado'); load()
  }

  return (
    <div style={{ padding: 8 }}>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, maxWidth: 320 }} placeholder="🔎 Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />
        <button onClick={startNuevo} style={{ background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Agregar modelo</button>
      </div>

      {form.modelo !== undefined && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>{edit ? '✏️ Editar' : '➕ Nuevo'} modelo</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Modelo *</label><input style={inputStyle} value={form.modelo} onChange={e => set('modelo', e.target.value)} /></div>
            <div><label style={labelStyle}>Impecable</label><input type="number" style={inputStyle} value={form.impecable} onChange={e => set('impecable', e.target.value)} /></div>
            {FALLAS.map(k => (
              <div key={k}><label style={{ ...labelStyle, fontSize: 10.5 }}>{k}</label><input type="number" style={inputStyle} value={(form as any)[k]} onChange={e => set(k, e.target.value)} /></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={guardar} style={{ background: '#0F9D58', color: '#fff', padding: '9px 18px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💾 Guardar</button>
            <button onClick={() => { setEdit(null); setForm(empty) }} style={{ background: '#E5E7EB', color: '#374151', padding: '9px 16px', border: 'none', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #E6E7F0', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>Modelo</th><th style={{ padding: '8px' }}>Imp</th>
              {FALLAS.map(k => <th key={k} style={{ padding: '8px' }}>{k}</th>)}
              <th style={{ padding: '8px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={11} style={{ padding: 18, textAlign: 'center', color: '#889' }}>Sin resultados.</td></tr>}
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{r.modelo}</td>
                <td style={{ padding: '8px' }}>{fmtARS(r.impecable)}</td>
                {FALLAS.map(k => <td key={k} style={{ padding: '8px', color: '#C0392B' }}>{fmtARS(r[k])}</td>)}
                <td style={{ padding: '6px', whiteSpace: 'nowrap' }}>
                  <button onClick={() => startEdit(r)} style={{ marginRight: 6, padding: '5px 10px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => eliminar(r.id)} style={{ padding: '5px 10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
