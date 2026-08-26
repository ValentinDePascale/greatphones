'use client'

import { useEffect, useMemo, useState } from 'react'
import { fmtARS } from '@/lib/precios'
import type { TomaRow } from '../toma/TomaVista'
import type { PrecioRow } from '../PrecioEditor'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#3D4356', marginTop: 12 }

const FALLAS: Array<'bateria' | 'pantalla' | 'camara' | 'microfono' | 'parlante' | 'tapa' | 'marco' | 'pin'> = ['bateria', 'pantalla', 'camara', 'microfono', 'parlante', 'tapa', 'marco', 'pin']
const FALLA_LABEL: Record<string, string> = {
  bateria: 'Falta batería', pantalla: 'Falta pantalla', camara: 'Falta cámara',
  microfono: 'Falta micrófono', parlante: 'Falta parlante', tapa: 'Falta tapa trasera',
  marco: 'Falta marco', pin: 'Falta pin de carga',
}

export default function CalcTomaClient() {
  const [tomaItems, setTomaItems] = useState<TomaRow[]>([])
  const [listaItems, setListaItems] = useState<PrecioRow[]>([])
  const [ctModelo, setCtModelo] = useState('')
  const [cjModelo, setCjModelo] = useState('')
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({})
  const [tipoVenta, setTipoVenta] = useState<'normal' | 'preventa'>('normal')

  useEffect(() => {
    fetch('/api/admin/precios/toma', { credentials: 'include' }).then(r => r.json()).then(d => setTomaItems(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/precios', { credentials: 'include' }).then(r => r.json()).then(d => setListaItems(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const equipoToma = useMemo(() => tomaItems.find(t => t.modelo === ctModelo) || null, [tomaItems, ctModelo])
  const equipoCanje = useMemo(() => cjModelo ? listaItems.filter(p => p.modelo === cjModelo) : [], [listaItems, cjModelo])

  const descuentos = useMemo(() => {
    if (!equipoToma) return 0
    return FALLAS.reduce((s, k) => s + (marcadas[k] ? equipoToma[k] : 0), 0)
  }, [equipoToma, marcadas])

  const valorToma = equipoToma ? Math.max(0, (equipoToma.impecable || 0) - descuentos) : 0

  const precioCanje = useMemo(() => {
    if (!equipoCanje.length) return 0
    return tipoVenta === 'preventa' ? Math.min(...equipoCanje.map(p => p.preventaARS)) : Math.min(...equipoCanje.map(p => p.precioARS))
  }, [equipoCanje, tipoVenta])

  const diferencia = precioCanje - valorToma

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🧮 Calculadora de Toma</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Calcula el valor de toma según las fallas marcadas</p>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, marginTop: 14, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <label style={labelStyle}>Modelo (Toma de Equipos): *</label>
        <input list="ct-modelos" style={inputStyle} placeholder="🔎 Buscar modelo..." value={ctModelo} onChange={e => setCtModelo(e.target.value)} />
        <datalist id="ct-modelos">
          {tomaItems.map(t => <option key={t.id} value={t.modelo} />)}
        </datalist>

        <label style={{ marginTop: 18, display: 'block', fontWeight: 600, fontSize: 13, color: '#334' }}>Fallas del equipo:</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 8, fontSize: 13 }}>
          {FALLAS.map(k => (
            <label key={k} style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!marcadas[k]} onChange={e => setMarcadas({ ...marcadas, [k]: e.target.checked })} />
              {FALLA_LABEL[k]}
            </label>
          ))}
        </div>

        <div style={{ background: '#F4F6F9', borderRadius: 10, padding: 14, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}><span>Precio impecable:</span><b>{fmtARS(equipoToma?.impecable || 0)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#C0392B' }}><span>Descuentos:</span><b>-{fmtARS(descuentos)}</b></div>
          <div style={{ borderTop: '1px dashed #D1D5DB', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#1E8449' }}><span>VALOR DE TOMA</span><span>{fmtARS(valorToma)}</span></div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, marginTop: 20, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>🔁 Calculadora de Canje</h3>
        <label style={labelStyle}>Equipo vendido (Lista de Precios):</label>
        <input list="cj-modelos" style={inputStyle} placeholder="🔎 Buscar modelo..." value={cjModelo} onChange={e => setCjModelo(e.target.value)} />
        <datalist id="cj-modelos">
          {listaItems.map(p => <option key={p.id} value={p.modelo} />)}
        </datalist>

        <div style={{ marginTop: 16, fontSize: 13.5 }}>
          <span style={{ fontWeight: 600, color: '#334', marginRight: 16 }}>Tipo de venta:</span>
          {([['normal', '○ Venta normal'], ['preventa', '○ Preventa']] as const).map(([v, lab]) => (
            <label key={v} style={{ fontWeight: 'normal', marginRight: 18, cursor: 'pointer' }}>
              <input type="radio" name="cj_tipo" checked={tipoVenta === v} onChange={() => setTipoVenta(v)} /> {lab}
            </label>
          ))}
        </div>

        <div style={{ background: '#F4F6F9', borderRadius: 10, padding: 14, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}><span>Precio venta:</span><b>{fmtARS(precioCanje)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#1E8449' }}><span>Valor toma:</span><b>{fmtARS(equipoToma ? valorToma : 0)}</b></div>
          <div style={{ borderTop: '1px dashed #D1D5DB', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#4F46E5' }}><span>CLIENTE DEBE AGREGAR</span><span>{fmtARS(equipoToma && cjModelo ? diferencia : 0)}</span></div>
        </div>
      </div>
    </div>
  )
}
