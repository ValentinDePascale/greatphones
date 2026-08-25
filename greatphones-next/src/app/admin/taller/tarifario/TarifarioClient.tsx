'use client'

import { useCallback, useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }

interface TarifarioRow { modelo: string; trabajos: Array<{ nombre: string; precio: number | null; sinConfigurar?: boolean; motivo?: string }> }
interface ConfigRow { key: string; multiplicador: number; horas: number; activo: boolean }

const LABELS: Record<string, string> = {
  bateria: 'Batería', pantalla: 'Pantalla', camara: 'Cámara', microfono: 'Micrófono', parlante: 'Parlante',
  tapa: 'Tapa trasera', marco: 'Marco', pin: 'Pin de carga', flex: 'Flex de carga', botones: 'Botones laterales', chasis: 'Chasis',
}

export default function TarifarioClient() {
  const [tab, setTab] = useState<'ver' | 'config'>('ver')
  const [rows, setRows] = useState<TarifarioRow[]>([])
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [buscar, setBuscar] = useState('')
  const [msg, setMsg] = useState<{ t: string; s: string } | null>(null)

  const toast = (t: string, s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 4000) }

  const load = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/admin/taller', { credentials: 'include' }),
        fetch('/api/admin/taller/config', { credentials: 'include' }),
      ])
      setRows(await r1.json())
      setConfigs(await r2.json())
    } catch { toast('error', 'Error al cargar') }
  }, [])
  useEffect(() => { load() }, [load])

  const filtrados = rows.filter(r => !buscar || r.modelo.toLowerCase().includes(buscar.toLowerCase()))

  const setCfg = (key: string, field: 'multiplicador' | 'horas' | 'activo', val: any) =>
    setConfigs(cs => cs.map(c => c.key === key ? { ...c, [field]: val } : c))

  const guardarConfig = async (c: ConfigRow) => {
    const r = await fetch('/api/admin/taller/config', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: c.key, multiplicador: Number(c.multiplicador) || 1, horas: Number(c.horas) || 48, activo: c.activo }) })
    if (!r.ok) { const d = await r.json(); return toast('error', d.error || 'Error') }
    toast('success', `Config guardada (${LABELS[c.key] || c.key})`)
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>🔧 Tarifario Reparaciones</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Calculado desde Toma de Equipos × multiplicador de la configuración</p>

      <div style={{ display: 'flex', gap: 24, margin: '16px 0', borderBottom: '1px solid #E6E7F0' }}>
        {([['ver', '🔎 Ver tarifario'], ['config', '⚙️ Configuración']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ background: 'none', border: 'none', padding: '10px 4px', fontSize: 14, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#4F46E5' : '#64748b', cursor: 'pointer', borderBottom: tab === k ? '2px solid #4F46E5' : '2px solid transparent' }}>{label}</button>
        ))}
      </div>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, color: '#fff', fontWeight: 600, fontSize: 13, background: msg.t === 'success' ? '#0F9D58' : '#DC2626' }}>{msg.s}</div>}

      {tab === 'ver' ? (
        <>
          <input style={{ ...inputStyle, maxWidth: 340, marginBottom: 14 }} placeholder="🔎 Buscar modelo..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
            {filtrados.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#889', padding: 20 }}>Sin resultados.</div>}
            {filtrados.map(r => (
              <div key={r.modelo} style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)', padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#4F46E5', marginBottom: 4 }}>📱 {r.modelo}</div>
                {r.trabajos.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 2 }}>
                    <span>{t.nombre}:</span>
                    {t.precio != null ? <b>{fmtARS(t.precio)}</b> : <span style={{ color: '#B7950B' }}>sin configurar</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
          {configs.map(c => (
            <div key={c.key} style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{LABELS[c.key] || c.key}</div>
              <label style={{ fontSize: 12, color: '#667' }}>Multiplicador</label>
              <input type="number" step="0.1" style={inputStyle} value={c.multiplicador} onChange={e => setCfg(c.key, 'multiplicador', Number(e.target.value))} />
              <label style={{ fontSize: 12, color: '#667', marginTop: 8, display: 'block' }}>Horas estimadas</label>
              <input type="number" style={inputStyle} value={c.horas} onChange={e => setCfg(c.key, 'horas', Number(e.target.value))} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={c.activo} onChange={e => setCfg(c.key, 'activo', e.target.checked)} /> Activo
              </label>
              <button onClick={() => guardarConfig(c)} style={{ width: '100%', marginTop: 10, padding: 9, background: '#0F9D58', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💾 Guardar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
