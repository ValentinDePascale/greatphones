'use client'

import { useCallback, useEffect, useState } from 'react'

interface Pendiente { id: string; codigo: string; titulo: string; subtitulo: string; hora: string }
type DiaData = Record<string, Pendiente[]>

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const TIPOS: Array<{ key: string; label: string; color: string; soft: string }> = [
  { key: 'Reparaciones', label: 'Reparaciones', color: '#D97706', soft: '#FFFBEB' },
  { key: 'Preventas', label: 'Preventas', color: '#7C3AED', soft: '#F5F3FF' },
  { key: 'Pedidos', label: 'Pedidos', color: '#0D9488', soft: '#F0FDFA' },
  { key: 'Cotizaciones', label: 'Cotizaciones', color: '#2563EB', soft: '#EFF6FF' },
  { key: 'Arrepentimientos', label: 'Arrep.', color: '#DC2626', soft: '#FEF2F2' },
]

function Icono({ n }: { n: string }) {
  const paths: Record<string, string> = {
    wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    cart: 'M2 3h2l2.4 12.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19 7H5M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
    clipboard: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4',
    refresh: 'M4 4v5h.582m15.356 2A8 8 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8 8 0 0 1-15.357-2m15.357 2H15',
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[n] || paths.wrench} />
    </svg>
  )
}

const ICOS: Record<string, string> = { Reparaciones: 'wrench', Preventas: 'cart', Pedidos: 'clipboard', Cotizaciones: 'refresh', Arrepentimientos: 'refresh' }

export default function CalendarioClient() {
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [data, setData] = useState<Record<string, DiaData>>({})
  const [cargando, setCargando] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<string | null>(null)

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
    setYear(y); setMonth(m); setSelected(null); setTab(null)
  }

  const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const hoyIso = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const totalTipos = (key: string) => TIPOS.reduce((s, t) => s + (data[key]?.[t.key]?.length || 0), 0)
  const conteoMes: Record<string, number> = {}
  TIPOS.forEach(t => conteoMes[t.key] = 0)
  Object.values(data).forEach((d: DiaData) => { TIPOS.forEach(t => { if (d[t.key]) conteoMes[t.key] += d[t.key].length }) })
  const totalMes = TIPOS.reduce((s, t) => s + conteoMes[t.key], 0)

  const diaSel = selected ? data[selected] || {} : {}
  const tabSel = tab || TIPOS[0].key

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-.3px' }}>Calendario de pendientes</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 4 }}>Reparaciones, preventas, pedidos, cotizaciones y arrepentimientos por día</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 17, color: '#0F172A' }}>‹</button>
          <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente" style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 17, color: '#0F172A' }}>›</button>
          <button onClick={() => { setYear(hoy.getFullYear()); setMonth(hoy.getMonth()); setSelected(hoyIso) }} style={{ padding: '0 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>Hoy</button>
        </div>
      </div>

      {/* Resumen por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,#FF6B2C,#F59E0B)', borderRadius: 14, padding: '16px 18px', color: '#fff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: .85 }}>Total del mes</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{cargando ? '…' : totalMes}</div>
        </div>
        {TIPOS.map(t => (
          <div key={t.key} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{t.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{cargando ? '…' : conteoMes[t.key]}</div>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{MESES[month]} {year}</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,.04),0 12px 40px rgba(15,23,42,.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {DIAS.map(d => <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={'b' + i} style={{ minHeight: 108, borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const key = iso(year, month, day)
              const d: DiaData | undefined = data[key]
              const esHoy = key === hoyIso
              const sel = key === selected
              const items = TIPOS.flatMap(t => (d?.[t.key] || []).map(x => ({ ...x, tipo: t.key })))
              return (
                <button
                  key={key}
                  onClick={() => { setSelected(sel ? null : key); setTab(TIPOS[0].key) }}
                  aria-pressed={sel}
                  style={{
                    minHeight: 108, padding: 7, textAlign: 'left', verticalAlign: 'top',
                    borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
                    background: sel ? '#EEF2FF' : (esHoy ? '#FFFBEB' : '#fff'),
                    cursor: 'pointer', position: 'relative',
                    transition: 'background .12s',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: esHoy || sel ? 800 : 600, color: esHoy ? '#D97706' : '#334155' }}>
                    {day}
                    {esHoy && <span style={{ fontSize: 9, marginLeft: 4, background: '#F59E0B', color: '#fff', borderRadius: 6, padding: '1px 5px' }}>hoy</span>}
                  </div>
                  {items.length > 0 && (
                    <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {items.slice(0, 3).map((it, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#334155', background: '#F8FAFC', borderRadius: 5, padding: '2px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TIPOS.find(t => t.key === it.tipo)!.color, flexShrink: 0 }} />
                          {it.titulo}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748B' }}>+{items.length - 3} más</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detalle del día */}
      {selected && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
              {new Date(selected + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span style={{ fontWeight: 500, marginLeft: 10, fontSize: 12.5, color: '#64748B' }}>
                {totalTipos(selected)} pendientes
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {TIPOS.map(t => {
              const n = diaSel[t.key]?.length || 0
              const active = tabSel === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-pressed={active}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', borderRadius: 999,
                    border: `1px solid ${active ? t.color : '#E2E8F0'}`,
                    background: active ? t.color : '#fff',
                    color: active ? '#fff' : '#475569',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#fff' : t.color }} />
                  {t.label} · {n}
                </button>
              )
            })}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, marginTop: 12, overflow: 'hidden' }}>
            {(diaSel[tabSel] || []).length === 0 ? (
              <div style={{ padding: '26px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5 }}>Sin pendientes de este tipo en el día.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.4px' }}>Referencia</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.4px' }}>Detalle</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.4px' }}>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {(diaSel[tabSel] || []).map((it: Pendiente) => (
                    <tr key={it.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: TIPOS.find(t => t.key === tabSel)!.color }}><Icono n={ICOS[tabSel] || 'wrench'} /></span>
                          {it.codigo}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{it.titulo}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{it.subtitulo}</div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(it.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}