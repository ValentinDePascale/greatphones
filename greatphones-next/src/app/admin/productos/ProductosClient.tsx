'use client'

import { useMemo, useState } from 'react'
import AdminToast from '@/components/admin/AdminToast'
import AdminModal from '@/components/admin/AdminModal'
import { inputStyle, inputErrorStyle, labelStyle, COLORS } from '@/components/admin/tokens'
import { useAdminFetch } from '@/hooks/useAdminFetch'

interface Producto {
  id: string
  name: string
  sub?: string | null
  brand?: string | null
  storage?: string | null
  color?: string | null
  type?: string | null
  condition?: string | null
  price: number
  cost?: number | null
  stock: number
  isOffer?: boolean
  discount?: number | null
  imageUrl?: string | null
  isPreorder?: boolean
}

function fmt(n: number) {
  return '$' + (n || 0).toLocaleString('es-AR')
}

export default function ProductosClient() {
  const { data: rows, loading, error } = useAdminFetch<Producto>('/api/products')
  const productos = useMemo(() => rows.filter(r => !r.isPreorder), [rows])
  const [buscar, setBuscar] = useState('')
  const [filtro, setFiltro] = useState<'all' | 'offer' | 'nostock' | 'low'>('all')
  const [orden, setOrden] = useState<'name' | 'price' | 'stock'>('name')
  const [edit, setEdit] = useState<Producto | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: 'success' | 'error'; s: string } | null>(null)

  const filtrados = useMemo(() => {
    let out = [...productos]
    if (buscar) {
      const q = buscar.toLowerCase()
      out = out.filter(p => `${p.name} ${p.sub || ''} ${p.brand || ''}`.toLowerCase().includes(q))
    }
    if (filtro === 'offer') out = out.filter(p => p.isOffer)
    if (filtro === 'nostock') out = out.filter(p => (p.stock || 0) <= 0)
    if (filtro === 'low') out = out.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 3)
    out.sort((a, b) => {
      if (orden === 'price') return (b.price || 0) - (a.price || 0)
      if (orden === 'stock') return (b.stock || 0) - (a.stock || 0)
      return (a.name || '').localeCompare(b.name || '')
    })
    return out
  }, [productos, buscar, filtro, orden])

  const stockColor = (s: number) => (s <= 0 ? COLORS.error : s <= 3 ? '#F59E0B' : COLORS.success)

  return (
    <div style={{ padding: '12px 16px' }}>
      <style>{`
        .pcard-grid{ display:grid; grid-template-columns: repeat(auto-fill,minmax(190px,1fr)); gap:14px; }
        .pcard{ background:#fff; border:1px solid ${COLORS.border}; border-radius:16px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04); transition: transform .15s, box-shadow .15s; }
        .pcard:hover{ transform: translateY(-2px); box-shadow:0 8px 22px rgba(0,0,0,.08); }
        .pcard-img{ height:120px; background: var(--cream2, #f0ebe3); display:flex; align-items:center; justify-content:center; position:relative; }
        .pcard-badge{ position:absolute; top:8px; left:8px; font-size:10px; font-weight:800; padding:3px 7px; border-radius:20px; color:#fff; }
      `}</style>

      {msg && <AdminToast t={msg.t} s={msg.s} />}

      {error && (
        <div role="alert" style={{ background: COLORS.errorBg, border: `1px solid #FECACA`, color: COLORS.error, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, background: COLORS.inputBg, border: `1.5px solid ${COLORS.border}`, borderRadius: 9, padding: '0 10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: COLORS.textSoft }} aria-hidden="true">search</span>
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre, marca..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '9px 0', fontSize: 13, color: COLORS.text }} aria-label="Buscar productos" />
          {buscar && <button onClick={() => setBuscar('')} aria-label="Limpiar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSoft }}>×</button>}
        </div>
        <select value={filtro} onChange={e => setFiltro(e.target.value as any)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="all">Todos</option>
          <option value="offer">Ofertas</option>
          <option value="nostock">Sin stock</option>
          <option value="low">Stock bajo</option>
        </select>
        <select value={orden} onChange={e => setOrden(e.target.value as any)} style={{ ...inputStyle, width: 'auto', minWidth: 130 }}>
          <option value="name">Orden: Nombre</option>
          <option value="price">Orden: Precio</option>
          <option value="stock">Orden: Stock</option>
        </select>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{filtrados.length} / {productos.length} productos</span>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#8892A6', padding: 24 }}>Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#8892A6', padding: 24 }}>{buscar || filtro !== 'all' ? 'Sin resultados.' : 'No hay productos.'}</p>
      ) : (
        <div className="pcard-grid">
          {filtrados.map(p => {
            const profit = (p.price || 0) - (p.cost || 0)
            const badge = p.isOffer ? { text: `OFERTA${p.discount ? ` -${p.discount}%` : ''}`, bg: 'rgba(192,57,43,.92)' } : (p.stock || 0) <= 0 ? { text: 'SIN STOCK', bg: COLORS.error } : (p.stock || 0) <= 3 ? { text: 'STOCK BAJO', bg: '#F59E0B' } : null
            return (
              <article key={p.id} className="pcard">
                <div className="pcard-img">
                  {badge && <span className="pcard-badge" style={{ background: badge.bg }}>{badge.text}</span>}
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ maxHeight: 100, maxWidth: '90%', objectFit: 'contain' }} loading="lazy" /> : <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#cbd5e1' }} aria-hidden="true">smartphone</span>}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                  <p style={{ fontSize: 11.5, color: COLORS.textMuted, margin: '2px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[p.sub, p.storage, p.color].filter(Boolean).join(' · ') || '—'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
                    <span style={{ color: '#B45309', fontWeight: 700 }}>{fmt(p.price)}</span>
                    <span style={{ color: COLORS.textMuted, textAlign: 'right' }}>{fmt(profit)} <span style={{ color: profit >= 0 ? COLORS.success : COLORS.error }}>({profit >= 0 ? '+' : ''})</span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 36, height: 4, borderRadius: 99, background: '#E6E7F0', overflow: 'hidden', display: 'inline-block' }}>
                        <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (p.stock / 15) * 100)}%`, background: stockColor(p.stock) }} />
                      </span>
                      <span style={{ color: stockColor(p.stock), fontWeight: 700 }}>{p.stock}</span>
                    </span>
                    <span style={{ textAlign: 'right', color: COLORS.textSoft }}>{p.brand || ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={() => setEdit(p)} style={{ flex: 1, padding: '7px 8px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Editar</button>
                    <button onClick={async () => { if (!confirm('¿Eliminar?')) return; const r = await fetch(`/api/products/${p.id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) setMsg({ t: 'success', s: 'Eliminado' }); else setMsg({ t: 'error', s: 'Error' }); setTimeout(() => setMsg(null), 3000) }} style={{ padding: '7px 8px', background: '#fff', color: COLORS.error, border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} aria-label={`Eliminar ${p.name}`}>Eliminar</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AdminModal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Editar ${edit.name}` : 'Editar'} icon="edit" maxWidth={560}
        footer={
          <>
            <button onClick={() => setEdit(null)} disabled={saving} style={{ background: '#EEF0F6', color: '#374151', padding: '9px 18px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={async () => { if (!edit) return; setSaving(true); try { const r = await fetch(`/api/products/${edit.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: edit.price, stock: edit.stock }) }); if (!r.ok) throw new Error(); setMsg({ t: 'success', s: 'Actualizado' }); setEdit(null) } catch { setMsg({ t: 'error', s: 'Error' }) } finally { setSaving(false); setTimeout(() => setMsg(null), 3000) }}} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: saving ? '#7FD3A8' : '#0F9D58', color: '#fff', padding: '9px 20px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }>
        {edit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Precio</label>
              <input type="number" value={String(edit.price)} onChange={e => setEdit({ ...edit, price: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Stock</label>
              <input type="number" value={String(edit.stock)} onChange={e => setEdit({ ...edit, stock: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre</label>
              <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} style={inputStyle} />
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
