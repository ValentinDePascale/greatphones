'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface StatsData {
  totals: {
    total: number
    pending: number
    approved: number
    rejected: number
    reviewing: number
    completed: number
    approvalRate: number
    avgFinalPrice: number
    totalApprovedValue: number
    monthlyApprovedValue: number
  }
  funnel: { received: number; approved: number; completed: number; conversionRate: number }
  topDevices: Array<{ device: string; count: number; avgPrice: number }>
  byCondition: Array<{ condition: string; count: number }>
  monthlyBreakdown: Array<{ month: string; total: number; approved: number; rejected: number; revenue: number }>
  recent: Array<{
    id: string
    code: string
    device: string
    clientName: string | null
    finalPrice: number
    status: string
    createdAt: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF6B2C',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  REVIEWING: '#8b5cf6',
  COMPLETED: '#3b82f6',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aceptada',
  REJECTED: 'Rechazada',
  REVIEWING: 'En revisión',
  COMPLETED: 'Completada',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR').format(n)
}
function fmtMoney(n: number) {
  return `$${fmt(n)}`
}

export default function QuotesDashboardClient() {
  const [data, setData] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/quotes-stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        Error cargando dashboard: {error}
      </div>
    )
  }
  if (!data) {
    return (
      <div style={{ padding: '2rem', color: '#64748b' }}>Cargando dashboard…</div>
    )
  }

  const t = data.totals
  const maxMonthly = Math.max(...data.monthlyBreakdown.map(m => m.total), 1)
  const maxDevice = Math.max(...data.topDevices.map(d => d.count), 1)

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Dashboard de Cotizaciones
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Métricas y tendencias de cotizaciones recibidas
          </p>
        </div>
        <Link
          href="/admin/cotizaciones"
          style={{
            padding: '8px 16px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            color: '#0f172a',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          ← Volver al listado
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total cotizaciones" value={fmt(t.total)} accent="#3b82f6" />
        <KpiCard label="Tasa de aceptación" value={`${t.approvalRate}%`} accent="#10b981" />
        <KpiCard
          label="Valor total aprobado"
          value={fmtMoney(t.totalApprovedValue)}
          accent="#FF6B2C"
        />
        <KpiCard
          label="Ticket promedio"
          value={fmtMoney(t.avgFinalPrice)}
          accent="#8b5cf6"
        />
      </div>

      {/* Status breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const count = t[key.toLowerCase() as keyof typeof t] as number
          return (
            <div
              key={key}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '12px 14px',
                borderLeft: `4px solid ${STATUS_COLORS[key]}`,
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {fmt(count)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Monthly chart */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: 16 }}>
            Cotizaciones por mes (últimos 12 meses)
          </h2>
          {data.monthlyBreakdown.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: 24, textAlign: 'center' }}>
              Sin datos aún
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
              {data.monthlyBreakdown.map((m, i) => {
                const monthLabel = m.month.slice(5) // MM
                const totalHeight = (m.total / maxMonthly) * 100
                const approvedHeight = (m.approved / maxMonthly) * 100
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ position: 'relative', width: '100%', height: 160, display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        title={`${m.total} cotizaciones (${m.approved} aceptadas)`}
                        style={{
                          width: '100%',
                          height: `${totalHeight}%`,
                          background: '#e2e8f0',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            height: `${(approvedHeight / totalHeight) * 100}%`,
                            background: '#10b981',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{monthLabel}</div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#64748b' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#e2e8f0', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />Total</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />Aceptadas</span>
          </div>
        </div>

        {/* Funnel */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: 16 }}>
            Embudo de conversión
          </h2>
          <FunnelRow label="Recibidas" value={data.funnel.received} max={data.funnel.received} color="#3b82f6" />
          <FunnelRow label="Aceptadas" value={data.funnel.approved} max={data.funnel.received} color="#10b981" />
          <FunnelRow label="Completadas" value={data.funnel.completed} max={data.funnel.received} color="#FF6B2C" />
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Conversión total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              {data.funnel.conversionRate}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Top devices */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: 16 }}>
            Dispositivos más cotizados
          </h2>
          {data.topDevices.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: 24, textAlign: 'center' }}>
              Sin datos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topDevices.map((d, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{d.device}</span>
                    <span style={{ color: '#64748b' }}>
                      {d.count} · <span style={{ color: '#FF6B2C' }}>{fmtMoney(d.avgPrice)}</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(d.count / maxDevice) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #FF6B2C, #FF8C55)',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By condition */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: 16 }}>
            Distribución por condición
          </h2>
          {data.byCondition.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: 24, textAlign: 'center' }}>
              Sin datos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.byCondition.map((c, i) => {
                const pct = (c.count / t.total) * 100
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#0f172a' }}>{c.condition}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {c.count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: 16 }}>
          Últimas cotizaciones
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Código</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Dispositivo</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Cliente</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Precio</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#0f172a' }}>{r.code}</td>
                <td style={{ padding: '10px 6px', color: '#0f172a' }}>{r.device}</td>
                <td style={{ padding: '10px 6px', color: '#64748b' }}>{r.clientName || '—'}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {fmtMoney(r.finalPrice)}
                </td>
                <td style={{ padding: '10px 6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#fff',
                      background: STATUS_COLORS[r.status] || '#94a3b8',
                    }}
                  >
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right', color: '#64748b' }}>
                  {new Date(r.createdAt).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '16px 18px',
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
        {value}
      </div>
    </div>
  )
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#64748b' }}>{label}</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 5,
            transition: 'width .5s ease',
          }}
        />
      </div>
    </div>
  )
}
