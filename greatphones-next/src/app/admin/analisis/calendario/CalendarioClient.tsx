'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Pendiente { id: string; codigo: string; titulo: string; subtitulo: string; hora: string; href?: string; reprogramado?: boolean }
type DiaData = Record<string, Pendiente[]>
interface Contadores { reparaciones: number; preventasPendientes: number; preventasCompradas: number; cotizaciones: number; arrepentimientos: number; pedidos: number }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

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
  const router = useRouter()
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth())
  const [data, setData] = useState<Record<string, DiaData>>({})
  const [contadores, setContadores] = useState<Contadores | null>(null)
  const [cargando, setCargando] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<string | null>(null)
  const [reprogramando, setReprogramando] = useState<string | null>(null)
  const [fechaNueva, setFechaNueva] = useState('')
  const [guardandoReprog, setGuardandoReprog] = useState(false)

  const load = useCallback(async () => {
    setCargando(true)
    const mes = `${year}-${String(month + 1).padStart(2, '0')}`
    try {
      const r = await fetch(`/api/admin/calendario?mes=${mes}`, { credentials: 'include' })
      const d = await r.json()
      setData(d.pendientes || {})
      setContadores(d.contadores || null)
    } catch { setData({}); setContadores(null) }
    setCargando(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const cambiarMes = (delta: number) => {
    let y = year, m = month + delta
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setYear(y); setMonth(m); setSelected(null); setTab(null)
  }

  const abrirReprogramar = (it: Pendiente) => {
    setReprogramando(it.id)
    setFechaNueva(it.hora.split('T')[0])
  }
  const cerrarReprogramar = () => { setReprogramando(null); setFechaNueva('') }

  const guardarReprogramacion = async (tipo: string, id: string) => {
    if (!fechaNueva) return
    setGuardandoReprog(true)
    try {
      await fetch('/api/admin/calendario/reprogramar', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: tipo, entityId: id, date: fechaNueva }),
      })
      cerrarReprogramar()
      await load()
    } finally {
      setGuardandoReprog(false)
    }
  }

  const quitarReprogramacion = async (tipo: string, id: string) => {
    setGuardandoReprog(true)
    try {
      await fetch(`/api/admin/calendario/reprogramar?entityType=${encodeURIComponent(tipo)}&entityId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await load()
    } finally {
      setGuardandoReprog(false)
    }
  }

  const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const hoyIso = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const itemsDelDia = (key: string) => TIPOS.flatMap(t => (data[key]?.[t.key] || []).map(x => ({ ...x, tipo: t.key })))
  const totalPorDia = (key: string) => itemsDelDia(key).length
  const totalMes = Object.keys(data).reduce((s, k) => s + totalPorDia(k), 0)

  const conteoTipoDia = (key: string, tipo: string) => data[key]?.[tipo]?.length || 0
  const totalTipos = selected ? totalPorDia(selected) : 0
  const diaSel: DiaData = selected ? data[selected] || {} : {}
  const tabSel = tab || TIPOS[0].key

  // Ranking: días del mes con más pendientes
  const ranking = Object.keys(data)
    .filter(k => {
      const [y, m] = k.split('-').map(Number)
      return y === year && m === month + 1
    })
    .map(k => ({ dia: k, total: totalPorDia(k), items: itemsDelDia(k) }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxRanking = ranking[0]?.total || 1

  const KPI_ERP = [
    { label: 'Reparaciones abiertas', value: contadores?.reparaciones ?? 0, color: '#D97706' },
    { label: 'Preventas pendientes', value: contadores?.preventasPendientes ?? 0, color: '#7C3AED' },
    { label: 'Preventas compradas', value: contadores?.preventasCompradas ?? 0, color: '#C026D3' },
    { label: 'Cotizaciones', value: contadores?.cotizaciones ?? 0, color: '#2563EB' },
    { label: 'Arrepentimientos', value: contadores?.arrepentimientos ?? 0, color: '#DC2626' },
    { label: 'Pedidos en camino', value: contadores?.pedidos ?? 0, color: '#0D9488' },
  ]

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="calHeader" style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '20px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="calHeaderInner" style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="calTitle" style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 }}>Calendario de pendientes</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Gestión de tareas y reprogramación de fechas</p>
          </div>
          <button
            onClick={() => { setYear(hoy.getFullYear()); setMonth(hoy.getMonth()); setSelected(hoyIso) }}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0F172A', transition: 'all .2s' }}
            onMouseOver={e => { (e.target as HTMLButtonElement).style.background = '#F1F5F9' }}
            onMouseOut={e => { (e.target as HTMLButtonElement).style.background = '#fff' }}
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="calBody" style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
        {/* KPIs compactos en la parte superior */}
        <div className="calKpiGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #FF6B2C, #F59E0B)', borderRadius: 12, padding: '16px', color: '#fff', boxShadow: '0 2px 8px rgba(255, 107, 44, .15)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.9 }}>Total del mes</div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, marginTop: 6 }}>{cargando ? '…' : totalMes}</div>
          </div>
          {KPI_ERP.map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginTop: 4 }}>{cargando ? '…' : k.value}</div>
            </div>
          ))}
        </div>

        {/* Layout principal: Calendario + Sidebar */}
        <div className="calMainGrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>
          {/* Calendario Principal */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, .06)' }}>
            {/* Header del Calendario */}
            <div className="calCalHeader" style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={() => cambiarMes(-1)}
                  aria-label="Mes anterior"
                  className="calNavBtn"
                  style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 20, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                  onMouseOver={e => { (e.target as HTMLButtonElement).style.background = '#EFF6FF' }}
                  onMouseOut={e => { (e.target as HTMLButtonElement).style.background = '#F8FAFC' }}
                >
                  ‹
                </button>
                <div style={{ minWidth: 180 }} className="calMonthLabel">
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{MESES[month]}</div>
                  <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>{year}</div>
                </div>
                <button
                  onClick={() => cambiarMes(1)}
                  aria-label="Mes siguiente"
                  className="calNavBtn"
                  style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 20, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                  onMouseOver={e => { (e.target as HTMLButtonElement).style.background = '#EFF6FF' }}
                  onMouseOut={e => { (e.target as HTMLButtonElement).style.background = '#F8FAFC' }}
                >
                  ›
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{totalMes} pendientes en {MESES[month]}</div>
            </div>

            {/* Grid del Calendario */}
            <div className="calGridWrap" style={{ padding: '20px 28px' }}>
              {/* Encabezados de días */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
                {DIAS_CORTOS.map(d => <div key={d} className="calDowLabel" style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748B', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '.3px' }}>{d}</div>)}
              </div>

              {/* Días del mes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {Array.from({ length: firstWeekday }).map((_, i) => <div key={'blank' + i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const key = iso(year, month, day)
                  const d: DiaData | undefined = data[key]
                  const esHoy = key === hoyIso
                  const sel = key === selected
                  const items = TIPOS.flatMap(t => (d?.[t.key] || []).map(x => ({ ...x, tipo: t.key })))
                  const conteosTipo = TIPOS.map(t => ({ key: t.key, count: d?.[t.key]?.length || 0, color: t.color }))

                  return (
                    <button
                      key={key}
                      onClick={() => { setSelected(sel ? null : key); setTab(TIPOS[0].key) }}
                      aria-pressed={sel}
                      className="calDayCell"
                      style={{
                        aspectRatio: '1', padding: 12, textAlign: 'left', verticalAlign: 'top',
                        background: sel ? '#EEF2FF' : (esHoy ? '#FFFBEB' : '#fff'),
                        border: sel ? '2px solid #2563EB' : esHoy ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                        borderRadius: 14, cursor: 'pointer', position: 'relative', transition: 'all .15s',
                        display: 'flex', flexDirection: 'column',
                      }}
                      onMouseOver={e => !sel && (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseOut={e => !sel && (e.currentTarget.style.background = esHoy ? '#FFFBEB' : '#fff')}
                    >
                      {/* Número del día */}
                      <div className="calDayNum" style={{ fontSize: 13, fontWeight: esHoy || sel ? 800 : 700, color: sel ? '#2563EB' : esHoy ? '#D97706' : '#334155', lineHeight: 1 }}>
                        {day}
                      </div>

                      {/* Indicadores de pendientes */}
                      {items.length > 0 && (
                        <div style={{ marginTop: 6, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-start', minHeight: 0 }}>
                          {/* Puntos de color para cada tipo */}
                          <div className="calDayDots" style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {conteosTipo.filter(c => c.count > 0).map(c => (
                              <span key={c.key} title={`${c.count} ${c.key}`} style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, opacity: 0.8 }} />
                            ))}
                          </div>
                          {/* Número total de pendientes */}
                          <div className="calDayCount" style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginTop: 'auto' }}>
                            {items.length} {items.length === 1 ? 'tarea' : 'tareas'}
                          </div>
                        </div>
                      )}

                      {/* Badge "hoy" */}
                      {esHoy && (
                        <div className="calHoyBadge" style={{ fontSize: 8.5, background: '#F59E0B', color: '#fff', borderRadius: 5, padding: '2px 5px', width: 'fit-content', fontWeight: 700, marginTop: 'auto' }}>
                          HOY
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Resumen y Días ocupados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Legenda de colores */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(15, 23, 42, .06)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Tipos de pendientes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TIPOS.map(t => (
                  <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#475569', flex: 1 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Días más ocupados */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(15, 23, 42, .06)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Días más ocupados</div>
              {ranking.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94A3B8', padding: '16px 0', textAlign: 'center' }}>Sin pendientes en {MESES[month]}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {ranking.map((r, idx) => (
                    <button
                      key={r.dia}
                      onClick={() => { setSelected(r.dia); setTab(TIPOS[0].key) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                        padding: '10px 0', borderBottom: idx < ranking.length - 1 ? '1px solid #F1F5F9' : 'none',
                        transition: 'all .15s'
                      }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>
                          {new Date(r.dia + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#FF6B2C' }}>{r.total}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((r.total / maxRanking) * 100)}%`, background: 'linear-gradient(90deg, #FF6B2C, #F59E0B)', borderRadius: 3 }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detalle del día - Sección completa */}
      {selected && (
        <div className="calDetailWrap" style={{ marginTop: 24, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, .06)', maxWidth: 1600, margin: '24px auto 0' }}>
          {/* Header del panel */}
          <div className="calDetailHeader" style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                  {new Date(selected + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {totalTipos} {totalTipos === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
                style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                onMouseOver={e => { (e.target as HTMLButtonElement).style.background = '#F1F5F9' }}
                onMouseOut={e => { (e.target as HTMLButtonElement).style.background = '#fff' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filtros por tipo */}
          <div className="calDetailFilters" style={{ padding: '16px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIPOS.map(t => {
              const n = conteoTipoDia(selected, t.key)
              const active = tabSel === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-pressed={active}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12,
                    border: `1.5px solid ${active ? t.color : '#E2E8F0'}`,
                    background: active ? t.soft : '#fff', color: active ? t.color : '#475569',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s'
                  }}
                  onMouseOver={e => !active && (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseOut={e => !active && (e.currentTarget.style.background = '#fff')}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  {t.label} {n > 0 && <span style={{ fontWeight: 600, marginLeft: 4 }}>({n})</span>}
                </button>
              )
            })}
          </div>

          {/* Contenido */}
          <div style={{ padding: '20px 28px' }}>
            {(diaSel[tabSel] || []).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                No hay tareas de {TIPOS.find(t => t.key === tabSel)!.label.toLowerCase()} en este día
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(diaSel[tabSel] || []).map((it: Pendiente) => {
                  const tipoData = TIPOS.find(t => t.key === tabSel)!
                  return (
                    <div
                      key={it.id}
                      style={{
                        padding: '16px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff',
                        transition: 'all .15s'
                      }}
                      onMouseOver={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'
                        ;(e.currentTarget as HTMLElement).style.background = '#EEF2FF'
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
                        ;(e.currentTarget as HTMLElement).style.background = '#fff'
                      }}
                    >
                      {/* Header de la tarea */}
                      <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 8 }}>
                        <div style={{ color: tipoData.color, marginTop: 2, flexShrink: 0 }}><Icono n={ICOS[tabSel] || 'wrench'} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, cursor: it.href ? 'pointer' : 'default' }}
                            onClick={() => it.href && router.push(it.href)}
                            onMouseOver={e => it.href && (e.currentTarget.style.color = tipoData.color)}
                            onMouseOut={e => it.href && (e.currentTarget.style.color = '#0F172A')}
                          >
                            {it.codigo}
                          </div>
                          <div
                            style={{ fontWeight: 600, color: '#0F172A', fontSize: 15, marginTop: 3, cursor: it.href ? 'pointer' : 'default' }}
                            onClick={() => it.href && router.push(it.href)}
                          >
                            {it.titulo}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{it.subtitulo}</div>
                        </div>
                      </div>

                      {/* Footer: Fecha y acciones */}
                      <div className="calItemFooter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                            {new Date(it.hora).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          {it.reprogramado && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '3px 8px', borderRadius: 6 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">event_repeat</span>
                              Reprogramado
                            </span>
                          )}
                        </div>

                        {/* Botones de acción */}
                        {reprogramando === it.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="date"
                              value={fechaNueva}
                              onChange={e => setFechaNueva(e.target.value)}
                              style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 500 }}
                            />
                            <button
                              onClick={() => guardarReprogramacion(tabSel, it.id)}
                              disabled={guardandoReprog}
                              aria-label="Guardar nueva fecha"
                              style={{ padding: '6px 12px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}
                              onMouseOver={e => !guardandoReprog && (e.currentTarget.style.background = '#15803D')}
                              onMouseOut={e => !guardandoReprog && (e.currentTarget.style.background = '#16A34A')}
                            >
                              ✓ Guardar
                            </button>
                            <button
                              onClick={cerrarReprogramar}
                              disabled={guardandoReprog}
                              aria-label="Cancelar"
                              style={{ padding: '6px 12px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}
                              onMouseOver={e => !guardandoReprog && (e.currentTarget.style.background = '#F8FAFC')}
                              onMouseOut={e => !guardandoReprog && (e.currentTarget.style.background = '#fff')}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => abrirReprogramar(it)}
                              aria-label={`Reprogramar ${it.codigo}`}
                              title="Mover a otra fecha"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}
                              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB' }}
                              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">event</span>
                              Mover
                            </button>
                            {it.reprogramado && (
                              <button
                                onClick={() => quitarReprogramacion(tabSel, it.id)}
                                disabled={guardandoReprog}
                                aria-label={`Restaurar fecha original de ${it.codigo}`}
                                title="Restaurar fecha original"
                                style={{ padding: '6px 10px', background: '#fff', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', transition: 'all .2s' }}
                                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">restart_alt</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 1024px) {
          .calMainGrid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .calHeader {
            padding: 16px 16px !important;
          }
          .calHeaderInner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .calHeaderInner button {
            align-self: stretch !important;
          }
          .calTitle {
            font-size: 21px !important;
          }
          .calBody, .calDetailWrap {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .calKpiGrid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .calCalHeader {
            padding: 16px !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .calMonthLabel {
            min-width: 0 !important;
          }
          .calNavBtn {
            width: 36px !important;
            height: 36px !important;
            font-size: 16px !important;
          }
          .calGridWrap {
            padding: 12px !important;
          }
          .calDowLabel {
            font-size: 10px !important;
            padding: 4px 0 !important;
          }
          .calDayCell {
            padding: 5px !important;
            border-radius: 8px !important;
          }
          .calDayNum {
            font-size: 11px !important;
          }
          .calDayDots {
            gap: 2px !important;
          }
          .calDayCount {
            display: none !important;
          }
          .calHoyBadge {
            font-size: 6.5px !important;
            padding: 1px 3px !important;
          }
          .calDetailHeader {
            padding: 16px !important;
          }
          .calDetailFilters {
            padding: 12px 16px !important;
            gap: 6px !important;
          }
          .calDetailFilters button {
            padding: 8px 10px !important;
            font-size: 12px !important;
          }
          .calItemFooter {
            align-items: flex-start !important;
          }
        }
        @media (max-width: 420px) {
          .calKpiGrid {
            grid-template-columns: 1fr 1fr !important;
          }
          .calDayCell {
            padding: 3px !important;
          }
        }
      `}</style>
    </div>
  )
}