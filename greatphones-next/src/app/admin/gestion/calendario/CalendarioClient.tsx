'use client'

import { useCallback, useEffect, useState } from 'react'

interface Pendiente { id: string; codigo: string; titulo: string; subtitulo: string; hora: string }
interface DiaData { reparaciones: Pendiente[]; preventas: Pendiente[]; pedidos: Pendiente[] }
type MesData = Record<string, DiaData>

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const TIPOS: Array<{ key: keyof DiaData; label: string; color: string; bg: string; border: string }> = [
  { key: 'reparaciones', label: 'Reparaciones', color: '#B45309', bg: '#FFF7ED', border: '#Fed7aa' },
  { key: 'preventas', label: 'Preventas', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'pedidos', label: 'Pedidos online', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
]

export default function CalendarioClient() {
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [data, setData] = useState<MesData>({})
  const [cargando, setCargando] = useState(true)
  const [selected, setSelected] = useState<string | null>(null) // 'YYYY-MM-DD'

  const load = useCallback(async () => {
    setCargando(true)
    const mes = `${year}-${String(month + 1).padStart(2, '0')}`
    try {
      const r = await fetch(`/api/admin/calendario?mes=${mes}`, { credentials: 'include' })
      const d = await r.json()
      setData(d.pendientes || {})
    } catch { setData({}) }
    setCargando(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const cambiarMes = (delta: number) => {
    let y = year, m = month + delta
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setYear(y); setMonth(m); setSelected(null)
  }

  const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const hoyIso = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const vacio: DiaData = { reparaciones: [], preventas: [], pedidos: [] }
  const totalTipos: DiaData = selected ? data[selected] || vacio : vacio
  const totalMes = Object.values(data).reduce((s, d) => s + d.reparaciones.length + d.preventas.length + d.pedidos.length, 0)

  const cards = [
    <div key="n" style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Pendientes del mes</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#181B2E' }}>{totalMes}</div>
    </div>,
    ...TIPOS.map(t => (
      <div key={t.key} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.color }}>{t.label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#181B2E' }}>{Object.values(data).reduce((s, d) => s + d[t.key].length, 0)}</div>
      </div>
    )),
  ]

  const renderItem = (p: Pendiente) => (
    <div key={p.id} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E6E7F0', background: '#fff', marginBottom: 6 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.titulo} <span style={{ color: '#64748b', fontWeight: 500 }}>· {p.codigo}</span></div>
      <div style={{ fontSize: 11.5, color: '#64748b' }}>{p.subtitulo}</div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181B2E', margin: 0 }}>📅 Calendario de Pendientes</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Reparaciones, preventas y pedidos por día</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 14 }}>
        {cards}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid #E6E7F0', background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente" style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid #E6E7F0', background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#181B2E' }}>{MESES[month]} {year}</span>
        </div>
        <button onClick={() => { setYear(hoy.getFullYear()); setMonth(hoy.getMonth()); setSelected(hoyIso) }} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #E6E7F0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Hoy</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, marginTop: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#F4F6F9', borderBottom: '1px solid #E6E7F0' }}>
          {DIAS.map(d => <div key={d} style={{ padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={'b' + i} style={{ minHeight: 74, borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = iso(year, month, day)
            const d: DiaData | undefined = data[key]
            const esHoy = key === hoyIso
            const sel = key === selected
            const n = d ? d.reparaciones.length + d.preventas.length + d.pedidos.length : 0
            return (
              <button
                key={key}
                onClick={() => setSelected(sel ? null : key)}
                aria-pressed={sel}
                style={{
                  minHeight: 74, padding: 6, textAlign: 'left', verticalAlign: 'top',
                  borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
                  background: sel ? '#EEF2FF' : (esHoy ? '#FFF7ED' : '#fff'),
                  cursor: 'pointer', borderTop: esHoy ? '2px solid #F59E0B' : '2px solid transparent',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: esHoy || sel ? 800 : 600, color: esHoy ? '#B45309' : '#334' }}>{day}</div>
                {n > 0 && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                    {TIPOS.map(t => d && d[t.key].length > 0 ? (
                      <span key={t.key} title={`${d[t.key].length} ${t.label}`} style={{ width: 7, height: 7, borderRadius: '50%', background: t.color }} />
                    ) : null)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
        {TIPOS.map(t => (
          <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color }} /> {t.label}
          </span>
        ))}
      </div>

      {selected && (
        <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, marginTop: 16, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#181B2E', marginBottom: 10 }}>
            {new Date(selected + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            <span style={{ fontWeight: 500, marginLeft: 10, fontSize: 12, color: '#6B7280' }}>
              {totalTipos.reparaciones.length + totalTipos.preventas.length + totalTipos.pedidos.length} pendientes
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {TIPOS.map(t => {
              const items = totalTipos[t.key]
              return (
                <div key={t.key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    {t.label} ({items.length})
                  </div>
                  {items.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Sin pendientes</div> : items.map(renderItem)}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}