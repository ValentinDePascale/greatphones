'use client'

import { useCallback, useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'

export interface PrecioRow {
  id: string
  modelo: string
  almacenamiento: string
  precioARS: number
  preventaARS: number
  descuentoARS: number
}

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

interface Props {
  endpoint: string
  title: string
  emptyText: string
}

export default function PrecioEditor({ endpoint, title, emptyText }: Props) {
  const [rows, setRows] = useState<PrecioRow[]>([])
  const [buscar, setBuscar] = useState('')
  const [edit, setEdit] = useState<PrecioRow | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)
  const [form, setForm] = useState({ modelo: '', almacenamiento: '', precioARS: 0, preventaARS: 0, descuentoARS: 0 })

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const load = useCallback(async () => {
    try {
      const r = await fetch(endpoint, { credentials: 'include' })
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { toast('error', 'Error al cargar') }
  }, [endpoint])

  useEffect(() => { load() }, [load])

  const filtrados = rows.filter(r =>
    !buscar || (r.modelo + ' ' + r.almacenamiento).toLowerCase().includes(buscar.toLowerCase()))

  const startNuevo = () => {
    setNuevo(true); setEdit(null)
    setForm({ modelo: '', almacenamiento: '', precioARS: 0, preventaARS: 0, descuentoARS: 0 })
  }
  const startEdit = (r: PrecioRow) => {
    setEdit(r); setNuevo(false)
    setForm({ modelo: r.modelo, almacenamiento: r.almacenamiento, precioARS: r.precioARS, preventaARS: r.preventaARS, descuentoARS: r.descuentoARS })
  }

  const guardar = async () => {
    if (!form.modelo.trim()) return toast('error', 'El modelo es obligatorio')
    const payload = { ...form, precioARS: Number(form.precioARS) || 0, preventaARS: Number(form.preventaARS) || 0, descuentoARS: Number(form.descuentoARS) || 0 }
    const url = edit ? endpoint : endpoint
    const method = edit ? 'PATCH' : 'POST'
    const r = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit ? { id: edit.id, ...payload } : payload) })
    const d = await r.json()
    if (!r.ok) return toast('error', d.error || 'Error')
    toast('success', edit ? 'Precio actualizado' : 'Precio creado')
    setEdit(null); setNuevo(false); load()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este precio?')) return
    const r = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE', credentials: 'include' })
    if (!r.ok) { const d = await r.json(); return toast('error', d.error || 'Error') }
    toast('success', 'Eliminado')
    load()
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label style={{ ...labelStyle, marginTop: 0 }}>{label}</label>
      <input type={type} style={inputStyle} value={form[key] as any} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })} />
    </div>
  )

  return (
    <div style={{ padding: 8 }}>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <input style={{ ...inputStyle, maxWidth: 320 }} placeholder="🔎 Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />
        <button onClick={startNuevo} style={{ background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Agregar {title}</button>
      </div>

      {(nuevo || edit) && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>{edit ? '✏️ Editar' : '➕ Nuevo'} {title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 10 }}>
            {field('modelo', 'Modelo *')}
            {field('almacenamiento', 'Almacenamiento')}
            {field('precioARS', 'Precio ARS', 'number')}
            {field('preventaARS', 'Preventa ARS', 'number')}
            {field('descuentoARS', 'Descuento ARS', 'number')}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={guardar} style={{ background: '#0F9D58', color: '#fff', padding: '9px 18px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💾 Guardar</button>
            <button onClick={() => { setEdit(null); setNuevo(false) }} style={{ background: '#E5E7EB', color: '#374151', padding: '9px 16px', border: 'none', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ overflow: 'auto', border: '1px solid #E6E7F0', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: '9px 10px' }}>Modelo</th>
              <th style={{ padding: '9px 10px' }}>Almac.</th>
              <th style={{ padding: '9px 10px' }}>Precio ARS</th>
              <th style={{ padding: '9px 10px' }}>Preventa ARS</th>
              <th style={{ padding: '9px 10px' }}>Descuento ARS</th>
              <th style={{ padding: '9px 10px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={6} style={{ padding: 18, textAlign: 'center', color: '#889' }}>{emptyText}</td></tr>}
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.modelo}</td>
                <td style={{ padding: '8px 10px', color: '#667' }}>{r.almacenamiento || '—'}</td>
                <td style={{ padding: '8px 10px' }}>{fmtARS(r.precioARS)}</td>
                <td style={{ padding: '8px 10px', color: '#B7950B' }}>{fmtARS(r.preventaARS)}</td>
                <td style={{ padding: '8px 10px', color: '#1E8449' }}>{fmtARS(r.descuentoARS)}</td>
                <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
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
