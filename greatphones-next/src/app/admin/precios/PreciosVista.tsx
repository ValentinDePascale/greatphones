'use client'

import { useMemo, useState } from 'react'
import { fmtARS } from '@/lib/precios'
import { copiarTexto, textoPlanoPrecio, textoWhatsAppPrecio, type PrecioItem } from '@/lib/precios-client'

const TIPOS_VISTA = ['cards', 'tabla', 'compacta'] as const
type Vista = (typeof TIPOS_VISTA)[number]

const FILTROS = ['Todos', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16', 'iPhone 17']

interface Props {
  items: PrecioItem[]
  icono?: string
  dolarVenta?: number | null
  familiaFiltros?: string[]
}

export default function PreciosVista({ items, icono = '📱', dolarVenta = null, familiaFiltros }: Props) {
  const [buscar, setBuscar] = useState('')
  const [vista, setVista] = useState<Vista>('cards')
  const [filtro, setFiltro] = useState('Todos')
  const [ordenCampo, setOrdenCampo] = useState<keyof PrecioItem | null>(null)
  const [ordenDir, setOrdenDir] = useState<1 | -1>(1)

  const filtros = familiaFiltros || FILTROS

  const filtrados = useMemo(() => {
    let arr = items.filter(p => {
      if (filtro !== 'Todos') {
        const m = (p.modelo || '')
        if (!(m === filtro || m.startsWith(filtro + ' '))) return false
      }
      if (buscar) {
        const texto = (p.modelo + ' ' + (p.almacenamiento || '')).toLowerCase()
        if (!texto.includes(buscar.toLowerCase())) return false
      }
      return true
    })
    if (ordenCampo) {
      const campo = ordenCampo, dir = ordenDir
      arr = arr.slice().sort((a, b) => {
        const va = (a as any)[campo], vb = (b as any)[campo]
        if (typeof va === 'string') {
          return (va || '').toLowerCase() < (vb || '').toLowerCase() ? -dir : (va || '').toLowerCase() > (vb || '').toLowerCase() ? dir : 0
        }
        return ((Number(va) || 0) - (Number(vb) || 0)) * dir
      })
    }
    return arr
  }, [items, buscar, filtro, ordenCampo, ordenDir])

  const ordenarPor = (campo: keyof PrecioItem) => {
    if (ordenCampo === campo) setOrdenDir(ordenDir === 1 ? -1 : 1)
    else { setOrdenCampo(campo); setOrdenDir(1) }
  }

  const accionCopiar = (idx: number) => copiarTexto(textoPlanoPrecio(filtrados[idx]))
  const accionWhatsapp = (idx: number) => copiarTexto(textoWhatsAppPrecio(filtrados[idx]), '✅ Mensaje de WhatsApp copiado')

  const cabeza = (label: string, campo?: keyof PrecioItem) => (
    <th
      onClick={campo ? () => ordenarPor(campo) : undefined}
      style={{ position: 'sticky', top: 0, background: '#F4F6F9', padding: '8px', cursor: campo ? 'pointer' : 'default', userSelect: 'none', zIndex: 1, boxShadow: '0 1px 0 #E6E7F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >{label} {campo && ordenCampo === campo ? (ordenDir === 1 ? '▲' : '▼') : ''}</th>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          style={{ width: '100%', maxWidth: 340, padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }}
          placeholder="🔎 Buscar modelo..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        {dolarVenta ? (
          <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, alignSelf: 'center' }}>
            💵 Dólar venta: {fmtARS(dolarVenta)}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {filtros.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: filtro === f ? 700 : 500, color: filtro === f ? '#fff' : '#334', background: filtro === f ? '#4F46E5' : '#E5E7EB' }}
          >{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, fontSize: 12.5 }}>
        <span style={{ fontWeight: 600, color: '#334' }}>Vista:</span>
        {TIPOS_VISTA.map(v => (
          <label key={v} style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', textTransform: 'capitalize' }}>
            <input type="radio" checked={vista === v} onChange={() => setVista(v)} /> {v === 'cards' ? 'Cards' : v === 'tabla' ? 'Tabla' : 'Compacta'}
          </label>
        ))}
      </div>

      {vista === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
          {filtrados.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#889', padding: 20 }}>Sin resultados.</div>}
          {filtrados.map((p, i) => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)', padding: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#4F46E5' }}>{icono} {p.modelo}</div>
              <div style={{ fontSize: 12, color: '#778' }}>{p.almacenamiento || '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Venta:</span><b>{fmtARS(p.precioARS)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#B7950B' }}><span>Preventa:</span><b>{fmtARS(p.preventaARS)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#1E8449' }}><span>Descuento:</span><b>{fmtARS(p.descuentoARS)}</b></div>
              {dolarVenta ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#556' }}><span>USD:</span><b>US${Math.round(p.precioARS / dolarVenta)}</b></div>
              ) : null}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => accionCopiar(i)} style={{ flex: 1, padding: '7px 6px', fontSize: 10.5, background: '#5D6D7E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>📋 Copiar</button>
                <button onClick={() => accionWhatsapp(i)} style={{ flex: 1, padding: '7px 6px', fontSize: 10.5, background: '#1E8449', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>📲 WhatsApp</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(vista === 'tabla' || vista === 'compacta') && (
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', border: '1px solid #E6E7F0', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: vista === 'tabla' ? 12.5 : 12 }}>
            <colgroup>
              <col style={{ width: '26%' }} /><col style={{ width: '10%' }} /><col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} /><col style={{ width: '16%' }} /><col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {cabeza('Modelo', 'modelo')}
                {cabeza(vista === 'tabla' ? 'Almac.' : 'GB', 'almacenamiento')}
                {cabeza('Venta', 'precioARS')}
                {cabeza('Prev', 'preventaARS')}
                {cabeza('Desc', 'descuentoARS')}
                {dolarVenta ? cabeza('USD') : null}
                <th style={{ position: 'sticky', top: 0, background: '#F4F6F9', padding: '8px', zIndex: 1, boxShadow: '0 1px 0 #E6E7F0' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#889' }}>Sin resultados.</td></tr>}
              {filtrados.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#4F46E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{icono} {p.modelo}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#778' }}>{p.almacenamiento || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{fmtARS(p.precioARS)}</td>
                  <td style={{ padding: '6px 8px', color: '#B7950B' }}>{fmtARS(p.preventaARS)}</td>
                  <td style={{ padding: '6px 8px', color: '#1E8449' }}>{fmtARS(p.descuentoARS)}</td>
                  {dolarVenta ? <td style={{ padding: '6px 8px', color: '#556' }}>US${Math.round(p.precioARS / dolarVenta)}</td> : null}
                  <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => accionCopiar(i)} style={{ marginRight: 4, padding: '4px 7px', fontSize: 11, background: '#5D6D7E', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Copiar">📋</button>
                    <button onClick={() => accionWhatsapp(i)} style={{ padding: '4px 7px', fontSize: 11, background: '#1E8449', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} title="WhatsApp">📲</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
